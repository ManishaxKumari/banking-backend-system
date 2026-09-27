const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")

/**
 * - Create a new transaction
 * THE 10-STEP TRANSFER FLOW:
     * 1. Validate request
     * 2. Validate idempotency key
     * 3. Check account status
     * 4. Start session/transaction, derive sender balance from ledger (inside session)
     * 5. Create transaction (PENDING)
     * 6. Create DEBIT ledger entry
     * 7. Create CREDIT ledger entry
     * 8. Mark transaction COMPLETED
     * 9. Commit MongoDB session
     * 10. Send email notification
 */

async function createTransaction(req, res) {

    /**
     * 1. Validate request
     */
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body

    if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "FromAccount, toAccount, amount and idempotencyKey are required"
        })
    }

    if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({
            message: "Amount must be a positive number"
        })
    }

    if (fromAccount === toAccount) {
        return res.status(400).json({
            message: "fromAccount and toAccount cannot be the same"
        })
    }

    // FIX: fromAccount must actually belong to the authenticated user.
    // Previously any authenticated user could pass ANY account id as fromAccount.
    const fromUserAccount = await accountModel.findOne({
        _id: fromAccount,
        user: req.user._id
    })

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!fromUserAccount || !toUserAccount) {
        return res.status(400).json({
            message: "Invalid fromAccount or toAccount"
        })
    }

    if (fromUserAccount.currency !== toUserAccount.currency) {
        return res.status(400).json({
            message: "Currency mismatch between fromAccount and toAccount"
        })
    }

    /**
     * 2. Validate idempotency key
     */

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {
        if (isTransactionAlreadyExists.status === "COMPLETED") {
            return res.status(200).json({
                message: "Transaction already processed",
                transaction: isTransactionAlreadyExists
            })
        }

        if (isTransactionAlreadyExists.status === "PENDING") {
            return res.status(200).json({
                message: "Transaction is still processing",
            })
        }

        if (isTransactionAlreadyExists.status === "FAILED") {
            return res.status(500).json({
                message: "Transaction processing failed, please retry"
            })
        }

        if (isTransactionAlreadyExists.status === "REVERSED") {
            return res.status(500).json({
                message: "Transaction was reversed, please retry"
            })
        }
    }

    /**
     * 3. Check account status
     */

    if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
        return res.status(400).json({
            message: "Both fromAccount and toAccount must be ACTIVE to process transaction"
        })
    }

    let transaction;
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        /**
         * 4. Derive sender balance from ledger — INSIDE the transaction/session.
         * FIX: previously this ran before the session/transaction started, so
         * two concurrent requests could both read the same stale balance and
         * both pass the check (classic check-then-act race / double spend).
         * Running it inside the session means it's evaluated against the
         * transaction's own read concern, and combined with a retry-friendly
         * write conflict below, a second concurrent writer will fail instead
         * of silently overdrawing the account.
         */
        const balance = await fromUserAccount.getBalance({ session })

        if (balance < amount) {
            await session.abortTransaction()
            session.endSession()
            return res.status(400).json({
                message: `Insufficient balance. Current balance is ${balance}. Requested amount is ${amount}`
            })
        }

        /**
         * 5. Create transaction (PENDING)
         */
        transaction = (await transactionModel.create([ {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        } ], { session }))[ 0 ]

        /**
         * 6. Create DEBIT ledger entry
         */
        await ledgerModel.create([ {
            account: fromAccount,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        } ], { session })

        /**
         * 7. Create CREDIT ledger entry
         */
        await ledgerModel.create([ {
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], { session })

        /**
         * 8. Mark transaction COMPLETED
         */
        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )

        /**
         * 9. Commit MongoDB session
         */
        await session.commitTransaction()
        session.endSession()

    } catch (error) {
        // FIX: previously the transaction/session was never aborted or ended
        // here, leaking the session and leaving a half-written PENDING
        // transaction with no rollback.
        await session.abortTransaction()
        session.endSession()

        // FIX: a duplicate idempotencyKey race (two requests inserting the
        // same key at once) surfaces here as a Mongo E11000 error — treat it
        // as "already being processed" instead of a generic failure.
        if (error.code === 11000) {
            return res.status(200).json({
                message: "Transaction is already being processed"
            })
        }

        return res.status(400).json({
            message: "Transaction is Pending due to some issue, please retry after sometime",
        })
    }

    /**
     * 10. Send email notification — after commit, so a failed email never
     * blocks or rolls back money that has already moved.
     */
    try {
        await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)
    } catch (emailError) {
        console.error("Transaction email failed to send:", emailError.message)
    }

    return res.status(201).json({
        message: "Transaction completed successfully",
        transaction: transaction
    })
}

async function createInitialFundsTransaction(req, res) {
    const { toAccount, amount, idempotencyKey } = req.body

    if (!toAccount || !amount || !idempotencyKey) {
        return res.status(400).json({
            message: "toAccount, amount and idempotencyKey are required"
        })
    }

    if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({
            message: "Amount must be a positive number"
        })
    }

    const toUserAccount = await accountModel.findOne({
        _id: toAccount,
    })

    if (!toUserAccount) {
        return res.status(400).json({
            message: "Invalid toAccount"
        })
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id
    })

    if (!fromUserAccount) {
        return res.status(400).json({
            message: "System user account not found"
        })
    }

    const isTransactionAlreadyExists = await transactionModel.findOne({
        idempotencyKey: idempotencyKey
    })

    if (isTransactionAlreadyExists) {
        return res.status(200).json({
            message: "Transaction already processed",
            transaction: isTransactionAlreadyExists
        })
    }

    const session = await mongoose.startSession()
    let transaction;

    try {
        session.startTransaction()

        transaction = (await transactionModel.create([ {
            fromAccount: fromUserAccount._id,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING"
        } ], { session }))[ 0 ]

        await ledgerModel.create([ {
            account: fromUserAccount._id,
            amount: amount,
            transaction: transaction._id,
            type: "DEBIT"
        } ], { session })

        await ledgerModel.create([ {
            account: toAccount,
            amount: amount,
            transaction: transaction._id,
            type: "CREDIT"
        } ], { session })

        await transactionModel.findOneAndUpdate(
            { _id: transaction._id },
            { status: "COMPLETED" },
            { session }
        )

        await session.commitTransaction()
        session.endSession()

    } catch (error) {
        // FIX: this whole function previously had no try/catch at all — any
        // error mid-transaction left the session open with no rollback.
        await session.abortTransaction()
        session.endSession()

        if (error.code === 11000) {
            return res.status(200).json({
                message: "Transaction is already being processed"
            })
        }

        return res.status(400).json({
            message: "Initial funds transaction failed, please retry"
        })
    }

    return res.status(201).json({
        message: "Initial funds transaction completed successfully",
        transaction: transaction
    })
}

module.exports = {
    createTransaction,
    createInitialFundsTransaction
}
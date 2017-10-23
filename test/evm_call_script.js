const { assertInvalidOpcode } = require('./helpers/assertThrow')
const { encodeScript } = require('./helpers/evmScript')
const ExecutionTarget = artifacts.require('ExecutionTarget')
const Executor = artifacts.require('Executor')

contract('EVM call script', accounts => {
    let executor, executionTarget = {}

    before(async () => {
        executor = await Executor.new()
    })

    beforeEach(async () => {
        executionTarget = await ExecutionTarget.new()
    })

    it('executes single action script', async () => {
        const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
        const script = encodeScript([action])

        await executor.execute(script)

        assert.equal(await executionTarget.counter(), 1, 'should have executed action')
    })

    it('executes multi action script', async () => {
        const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
        const script = encodeScript([action, action, action, action])

        await executor.execute(script)

        assert.equal(await executionTarget.counter(), 4, 'should have executed action')
    })

    it('executes multi action script to multiple addresses', async () => {
        const executionTarget2 = await ExecutionTarget.new()

        const action = { to: executionTarget.address, calldata: executionTarget.contract.execute.getData() }
        const action2 = { to: executionTarget2.address, calldata: executionTarget2.contract.execute.getData() }

        const script = encodeScript([action2, action, action2, action, action2])

        await executor.execute(script)

        assert.equal(await executionTarget.counter(), 2, 'should have executed action')
        assert.equal(await executionTarget2.counter(), 3, 'should have executed action')
    })

    it('executes with parameters', async () => {
        const action = { to: executionTarget.address, calldata: executionTarget.contract.setCounter.getData(101) }
        const script = encodeScript([action])

        await executor.execute(script)

        assert.equal(await executionTarget.counter(), 101, 'should have set counter')
    })

    it('execution fails if one call fails', async () => {
        const action1 = { to: executionTarget.address, calldata: executionTarget.contract.setCounter.getData(101) }
        const action2 = { to: executionTarget.address, calldata: executionTarget.contract.failExecute.getData() }

        const script = encodeScript([action1, action2])

        return assertInvalidOpcode(async () => {
            await executor.execute(script)
        })
    })
})

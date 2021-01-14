require('dotenv').config()
const uniswap = require('./uniswap')
const { Weth } = require('./HelperFolders/uniswapConstants')
const percentageChange = require('./percentageChange')
const maximise = require('./maximise')


const isProfitable = async (filteredTransaction) => {

    let etherValue = filteredTransaction.etherValue;
    let tokenOutAmount = filteredTransaction.amountOutMin

    let { token, pair } = await uniswap.getData(filteredTransaction)
    let { priceIncrease, eth, pairToken } = await percentageChange(pair.liquidityToken.address.toLowerCase(), etherValue, tokenOutAmount)

    let MaximumEtherLoss = etherValue - (eth.price * tokenOutAmount)
    if (MaximumEtherLoss < 0) {
        console.log('undefined slippage')
        return undefined
    }
    let slippage = 1 + ((MaximumEtherLoss / etherValue) * 0.7);


    let willingToLoseUsd = MaximumEtherLoss * process.env.ETHPRICE

    let GasCost = ((filteredTransaction.gasPrice + 40e9) / 25e8)

    // console.log(filteredTransaction.txHash)

    // console.log("Price increase : " + priceIncrease)

    // console.log("Maximumu ether loss : " + MaximumEtherLoss)

    // console.log("Etherum value :" + etherValue)

    // console.log(`Willing to lose usd = ${willingToLoseUsd} GasCost  = ${GasCost}`)

    let tokenToBuy = await maximise(eth, pairToken, slippage)
    let theoreticalProfit = (tokenToBuy * priceIncrease * process.env.ETHPRICE)
    console.log("theoretical - gascost")
    console.log(theoreticalProfit - GasCost)
    if (parseFloat(theoreticalProfit) - GasCost > 40) {
        console.log({ tokenToBuy, eth, pairToken })
        let trade = uniswap.getTrade(pair, Weth, tokenToBuy * 1e18)
        return {
            buyObj: await uniswap.getBuyObj(filteredTransaction, trade, token),
            token,
            pair,
        }
    }
    return undefined
}

module.exports = isProfitable
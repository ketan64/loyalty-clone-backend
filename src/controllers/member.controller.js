const { forEach } = require('lodash');
const { memberService} = require('../services/index');
const { transactionService } = require('../services/index');
const catchAsync = require('../utils/catchAsync');

const getBalance = catchAsync(async (req, res) => {
    const { mobileNumber } = req.body;
    try {
      memberDetails = await memberService.getMember({ mobileNumber });
      
      if (!memberDetails) {
        return res.status(404).send({ message: "Member not found" });
      }
      
      let { balance } = memberDetails;
      if(balance<=0)
        balance=0;
  
      res.status(200).send({ message: "Balance fetched successfully", mobileNumber, balance });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "An error occurred while fetching the balance" });
    }
  });

  //transaction list for member and partner is still pending
  const memberTransactions = catchAsync(async (req, res) => {
    const { mobileNumber } = req.body;
    
    try {
      const memberDetails = await memberService.getMember({ mobileNumber });
      if (!memberDetails) {
        return res.status(404).send({ message: "Member not found" });
      }
      const memberTransactionsList = memberDetails.transactions;
      const transactionsDetails = [];
      for (let item of memberTransactionsList) {
        const itemDetails = await transactionService.getTransaction({ _id: item }); 
        if (itemDetails) {
          transactionsDetails.push(itemDetails);
        }
      }
      res.status(200).send({ transactionsDetails });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: error.message });
    }
  });


module.exports = {
    getBalance,
    memberTransactions
}
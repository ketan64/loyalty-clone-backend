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
      
      const { balance } = memberDetails;
      if(balance<=0)
        balance=0;
  
      res.status(200).send({ message: "Balance fetched successfully", mobileNumber, balance });
    } catch (error) {
      console.log(error);
      res.status(500).send({ message: "An error occurred while fetching the balance" });
    }
  });

/*
git config --global user.email "ketansutar2022@gmail.com"
git config --global user.name "ketan64"
*/

  //transaction list for member and partner is still pending
const memberTransactions = catchAsync( async(req, res) => {
    const { mobileNumber } = req.body;
    try{
        const memberTransactionsList = await memberService.getMember({mobileNumber}); 
    }
    catch(error){
        console.log(error);
        res.status(500).send({mwssage: error.message});
    }
}); 


module.exports = {
    getBalance,
    memberTransactions
}
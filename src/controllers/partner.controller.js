const catchAsync = require('../utils/catchAsync.js');
const { partnerService } = require('../services/index.js');
const { memberService } = require('../services/index.js');
const { transactionService } = require('../services/index.js');
const member = require('../models/member.model.js');
const transaction = require('../models/transaction.model.js')
const { v4 } = require('uuid');

const createPartner = catchAsync(async (req, res) => {
  const { body } = req;
  const partnerDetails = await partnerService.getPartner({ partnerName: body.partnerName });
  if (partnerDetails) return res.send({ success: false, message: 'Partner already exist' });
  const response = await partnerService.addPartner(body);
  res.send(response);
});

const updatePartner = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { body } = req;
  const partnerDetails = await partnerService.getPartner({ _id: id });
  if (!partnerDetails) res.send({ success: true, message: 'partner does not exist' });
  await partnerService.updatePartner({ _id: id }, { ...body });
  res.send({ success: true, message: 'details updated successfully!!!' });
});

const getPartnerList = catchAsync(async (req, res) => {
  const partnerDetails = await partnerService.getPartnerList();
  res.send(partnerDetails);
});

const getPartner = catchAsync(async (req, res) => {
  const partnerDetails = await partnerService.getPartner();
  res.send(partnerDetails);
});


const earnTransaction = catchAsync(async (req, res) => {
  const { mobileNumber, activityTs, activityCode, actualPurchaseAmount, partnerTransactionId, items, modeOfPayments } = req.body;
  let { earnAmount } = req.body;
  const partnerId = req.params.id;
  try {
    const partnerDetails = await partnerService.getPartner({_id: partnerId});
    if (!partnerDetails) {
      return res.status(404).send('Partner not found');
    }
    const itemTotalAmount = items.reduce((total, item) => {
      return total + item.amount; //later will check for reward per unit flag
    }, 0);

    const totalMopAmount = modeOfPayments.reduce((total, mop) => {
      return total + mop.amount;
    }, 0);

    if(actualPurchaseAmount != itemTotalAmount)
       return res.status(400).send({ message: 'Total item amount should be equal to earn amount'});
    if(actualPurchaseAmount != totalMopAmount)
      return res.status(400).send({ message: 'Total MOP amount should be equal to earn amount'});

    let memberDetails = await memberService.getMember({ mobileNumber : mobileNumber });
    if (!memberDetails) {
      const _id = 'user_'+v4();
      memberDetails = await memberService.addMember({_id, mobileNumber});
    }

    const transactionType = "earn"
    const existingTransaction = await transactionService.getTransaction({
      partnerTransactionId,
      mobileNumber,
      transactionType: transactionType,
      partnerId
    });
    
    if (existingTransaction!=null) {
      console.log("Existing earn :",existingTransaction);
      return res.status(400).send({ message: 'Duplicate partnerTransactionId' });
    }

    const excludedMopAmount = modeOfPayments.reduce((total, mop) => {
      if(partnerDetails.mopsExcludedFromEarnAmount && partnerDetails.mopsExcludedFromEarnAmount.includes(mop.code)){
        return total + mop.amount;
      }
      return total;
    }, 0);
    earnAmount -= excludedMopAmount;

    const pointsCalculation = (earnAmount*0.5/100);
    const transactionDetails = {
      mobileNumber: mobileNumber,
      partnerId,        
      earnAmount,
      activityTs: new Date(activityTs),
      activityCode,
      actualPurchaseAmount,
      partnerTransactionId,
      items,
      modeOfPayments,
      transactionType,
      pointsEarned : pointsCalculation
    };
    const trResult = await transactionService.addTransaction(transactionDetails);
    memberDetails.balance += pointsCalculation;
    if (!memberDetails.transactions) {
      memberDetails.transactions = [];
    }
    memberDetails.transactions.push(trResult._id);
    await memberService.updateMember({ _id: memberDetails._id }, { balance: memberDetails.balance, transactions: memberDetails.transactions,  });    
    res.status(201).send({ message: 'Earn Transaction recorded', trResult });
  } catch (error) {
    res.status(500).send(error.message);
    console.log(error);
  }
});

const redeemTransaction = catchAsync( async (req, res) => {
  const { mobileNumber, activityCode, partnerTransactionId, pointsRedeemed, activityTs, actualPurchaseAmount, items} = req.body;
  const partnerId = req.params.id;
  try{
    const partnerDetails = await partnerService.getPartner({_id: partnerId});
    if (!partnerDetails) {
      return res.status(404).send('Partner not found');
    }
    let memberDetails = await memberService.getMember({ mobileNumber : mobileNumber });
    const transactionType = "redeem"
    const existingTransaction = await transactionService.getTransaction({
      partnerTransactionId,
      mobileNumber,
      transactionType: transactionType,
      partnerId
    });
    if (existingTransaction!=null) {
      return res.status(400).send({ message: 'Duplicate partnerTransactionId' });
    }
    if(pointsRedeemed<=0.01)
    {
      return res.status(400).send({message: 'pointsRedeemed should be greater than 0.01'})
    }
    const transactionDetails = {
      mobileNumber: mobileNumber,
      partnerId,
      activityTs: new Date(activityTs),
      activityCode,
      actualPurchaseAmount,
      partnerTransactionId,
      items,
      transactionType
    };
    const trResult = await transactionService.addTransaction(transactionDetails);

    memberDetails.balance -= pointsRedeemed;
    if (!memberDetails.transactions) {
      memberDetails.transactions = [];
    }
    memberDetails.transactions.push(trResult._id);
    await memberService.updateMember({ _id: memberDetails._id }, { balance: memberDetails.balance, transactions: memberDetails.transactions });    
    res.status(201).send({ message: 'Redeem Transaction recorded', trResult });
  }
  catch(error) {
    res.status(500).send(error.message);
    console.log(error);
  }
});

const revertTransaction = catchAsync(async (req, res) => {
  const partnerId = req.params.id;
  const {mobileNumber, earnTransactionId, partnerTransactionId, returnedItems, returnedAmount, modeOfPayments, activityTs, activityCode, actualPurchaseAmount} = req.body;
  try{
    const partnerDetails = await partnerService.getPartner({_id: partnerId});
    if (!partnerDetails) {
      return res.status(404).send('Partner not found');
    }
    let memberDetails = await memberService.getMember({ mobileNumber : mobileNumber });
    const transactionType = "revert"
    const existingTransaction = await transactionService.getTransaction({
      partnerTransactionId,
      mobileNumber,
      transactionType: transactionType,
      partnerId
    });
    if (existingTransaction!=null) {
      return res.status(400).send({ message: 'Duplicate partnerTransactionId' });
    }

    const existingEarnTransaction = await transactionService.getTransaction({
      partnerTransactionId: earnTransactionId,
      mobileNumber,
      transactionType: "earn",
      partnerId
    });
    if(!existingEarnTransaction){
      return res.status(400).send({message: 'No earn transaction found with ${earnTransactionId}'});
    }
   
    const transactionDetails = {
      mobileNumber: mobileNumber,
      partnerId,
      earnTransactionId,
      activityTs: new Date(activityTs),
      activityCode,
      actualPurchaseAmount,
      partnerTransactionId,
      returnedItems,
      transactionType,
      returnedAmount,
      modeOfPayments,
      pointsReverted : existingEarnTransaction.pointsEarned
    };
    const trResult = await transactionService.addTransaction(transactionDetails);
    console.log('balance before revert :',memberDetails.balance);
    memberDetails.balance -= existingEarnTransaction.pointsEarned;
    console.log('balance after revert :',memberDetails.balance);
    if (!memberDetails.transactions) {
      memberDetails.transactions = [];
    }
    memberDetails.transactions.push(trResult._id);
    await memberService.updateMember({ _id: memberDetails._id }, { balance: memberDetails.balance, transactions: memberDetails.transactions });    
    res.status(201).send({ message: 'Revert Transaction recorded', trResult });
  }
  catch(error) {
    res.status(500).send(error.message);
    console.log(error);
  }
});

module.exports = {
  getPartnerList,
  createPartner,
  updatePartner,
  getPartner,
  earnTransaction,
  redeemTransaction,
  revertTransaction
};

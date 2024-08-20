const catchAsync = require('../utils/catchAsync.js');
const { partnerService } = require('../services/index.js');
const { memberService } = require('../services/index.js');
const { ruleService } = require('../services/index.js')
const { transactionService } = require('../services/index.js');
const member = require('../models/member.model.js');
const transaction = require('../models/transaction.model.js')
const { v4 } = require('uuid');
const rule = require('../models/rule.model.js');

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

function isRuleApplicable(rule, transaction) {
  // logic to check if a rule applies
  // Example: check if earnAmount is within a specific range, activityCode matches, etc.
  //we can check if ruleType is either from activity, or item, as per that we can test the conditions between transaction and the rule
  if(rule.ruleType=="")
  return transaction.activityCode === rule.activityCode && rule.items === transaction.items;
}


function calculatePoints(rule, earnAmount) {
  return (earnAmount * rule.amountOfPoints.percentageOfAmount) / 100; // Example: calculate percentage points
}

const earnTransaction = catchAsync(async (req, res) => {
  const { mobileNumber, activityTs, activityCode, actualPurchaseAmount, partnerTransactionId, items, modeOfPayments } = req.body;
  let { earnAmount } = req.body;
  const partnerId = req.params.id;
  try {
    const partnerDetails = await partnerService.getPartner({_id: partnerId});
    if (!partnerDetails) {
      return res.status(404).send('Partner not found');
    }

    // Fetch rules associated with the partner
    const rules = await ruleService.getRule({ partnerId });
    // console.log('Rules :', rules);
    let applicableRule = null;

    for (const rule of rules) {
      if (isRuleApplicable(rule, { partnerId, earnAmount, activityCode, items })) {
        applicableRule = rule;
        break; // Stop at the first applicable rule or continue if you need more logic
      }
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

    const mobileNumberRegex = /^[6-9]\d{9}$/;

    if (!mobileNumberRegex.test(mobileNumber)) {
      return res.status(400).send({ message: "Invalid mobile number format" });
    }
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
      // console.log("Existing earn :",existingTransaction);
      return res.status(400).send({ message: 'Duplicate partnerTransactionId' });
    }

    const excludedMopAmount = modeOfPayments.reduce((total, mop) => {
      if(partnerDetails.mopsExcludedFromEarnAmount && partnerDetails.mopsExcludedFromEarnAmount.includes(mop.code)){
        return total + mop.amount;
      }
      return total;
    }, 0);
    earnAmount -= excludedMopAmount;

    const pointsCalculation = calculatePoints(applicableRule, earnAmount);
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
    // console.log('balance before revert :',memberDetails.balance);
    memberDetails.balance -= existingEarnTransaction.pointsEarned;
    // console.log('balance after revert :',memberDetails.balance);
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

const addBaseRule = catchAsync( async(req, res) => {
  const partnerId = req.params.id;
  const {ruleCode, ruleDisplayText, mobileNumber, activityTs, activityCode, userFilters, activityFilters, itemFilters, validity, amountOfPoints, expiration, isRewardPerUnit, isActive} = req.body;
  const ruleType = 'baseRule';
  const existingRule = await ruleService.getRule({ruleCode});
  console.log("existing Rule :", existingRule);
  if(existingRule.length>0)
  {
    return res.status(400).send({message: "Rule with same code exist"});
  }
  try{
    const partnerDetails = await partnerService.getPartner({_id: partnerId});
    const addRule = {
      mobileNumber,
      ruleType,
      partnerId,
      ruleCode, 
      ruleDisplayText, 
      activityTs, 
      activityCode, 
      userFilters, 
      activityFilters, 
      itemFilters, 
      validity, 
      amountOfPoints, 
      expiration, 
      isRewardPerUnit, 
      isActive
    };
    const addRuleResult = await ruleService.addBaseRule(addRule);
    const ruleDetails = {
      _id: addRuleResult._id,
      ruleType,
      ruleCode
    }
    if(!partnerDetails.ruleDetails){
      partnerDetails.ruleDetails = [];
    }
    partnerDetails.ruleDetails.push(ruleDetails);
    const ifError = await partnerService.updatePartner({_id: partnerId},{$push :{ruleDetails:ruleDetails }});
    res.status(201).send({ message: 'Rule Added Successfully', addRuleResult });
  }
  catch(error){
    res.status(500).send(error.message);
    console.log(error);
  }
})

module.exports = {
  getPartnerList,
  createPartner,
  updatePartner,
  getPartner,
  earnTransaction,
  redeemTransaction,
  revertTransaction,
  addBaseRule,
};

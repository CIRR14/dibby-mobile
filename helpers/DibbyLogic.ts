import { DibbyExpense, DibbyParticipant, DibbySplitMethod, DibbyTrip } from "../constants/DibbyTypes";
import { numberWithCommas } from "./AppHelpers";

export interface ITransactions {
    owed: DibbyParticipant, 
    owee: DibbyParticipant, 
    amount: number
}

export interface ITransactionResponse {
    transactions: ITransactions[],
    finalNumberOfTransactions: number
}

const maxNumberOfTransactions = 100;


const inRange = (x: number, min: number, max: number): boolean => {
  return (x - min) * (x - max) <= 0;
};

const roundToDecimal = (number: number, decimals = 2): number => {
  return +number.toFixed(decimals);
};

export const calculateTrip = (
  trip: DibbyTrip
): ITransactionResponse => {
  let numberOfTransactions = 0;
  let returnThis: ITransactionResponse = {
    transactions: [],
    finalNumberOfTransactions: 0,
  };

  const findPersonByID = (id: string): DibbyParticipant | undefined => {
    return trip.participants.find((p) => p.uid === id);
  };

  const calculatePerTotal = (expenseAmounts: number[]): void => {
    const expenseTripTotal = expenseAmounts.reduce((partialSum, a) => partialSum + a, 0);
    trip.perPersonAverage = expenseTripTotal / trip.participants.length;
  };

  const calculatePerPersonPerExpense = (expense: DibbyExpense): void => {
    if (expense.splitMethod === DibbySplitMethod.EQUAL_PARTS) {
      expense.perPersonAverage = (expense.amount as number) / trip.participants.length;
    } else {
      console.log("expenses are not equal");
    }
  };

  const calculateTotalPaidByPerson = (expense: DibbyExpense) => {
    const personWhoPaid = findPersonByID(expense.paidBy);
    if (personWhoPaid) {
      personWhoPaid.amountPaid = personWhoPaid?.amountPaid + (expense?.amount as number);
    }
  };

  const calculateOwedPerPerson = (person: DibbyExpense) => {
    const tripPerson = findPersonByID(person.id);
    if (tripPerson) {
      tripPerson.owed = tripPerson.amountPaid - trip.perPersonAverage;
    }
  };

  const zeroOut = (loop: number) => {
    const getOwedArray = trip.participants?.map((p) => roundToDecimal(p.owed));
    const didEveryonePay = getOwedArray?.every((item) => {
      return inRange(item, -0.01, 0.01);
    });

    if (didEveryonePay || loop > maxNumberOfTransactions) {
      return;
    }

    const getHighestOrLowestOwed = (amount: number): DibbyParticipant => {
      return trip.participants[getOwedArray.indexOf(amount)];
    };

    const highestAmount: number = Math.max(...getOwedArray);
    const lowestAmount: number = Math.min(...getOwedArray);

    const highestOwed: DibbyParticipant = getHighestOrLowestOwed(highestAmount);
    const lowestOwed: DibbyParticipant = getHighestOrLowestOwed(lowestAmount);

    updateOwedColumn(highestOwed, lowestOwed);
    loop += 1;
    zeroOut(loop);
  };

  const updateOwedColumn = (owed: DibbyParticipant, owee: DibbyParticipant) => {
    // memoization for efficiecy
    let newOwedValue = 0;
    let newOweeValue = 0;
    let transactionAmount = 0;
    if (owed.owed >= Math.abs(owee.owed)) {
      // make owee 0 and owed the subtraction
      transactionAmount = Math.abs(owee.owed);
      newOwedValue = roundToDecimal(owed.owed - Math.abs(owee.owed));
      findPersonByID(owee.uid)!.amountPaid = roundToDecimal(owee.amountPaid - owee.owed);
      findPersonByID(owed.uid)!.amountPaid = roundToDecimal(owed.amountPaid + owee.owed);
    } else if (owed.owed < Math.abs(owee.owed)) {
      // make owed 0 and owee the addition
      transactionAmount = owed.owed;
      newOweeValue = owee.owed + owed.owed;
      findPersonByID(owee.uid)!.amountPaid = roundToDecimal(owee.amountPaid + owed.owed);
      findPersonByID(owed.uid)!.amountPaid = roundToDecimal(owed.amountPaid - owed.owed);
    } else {
      console.log("anomaly");
    }
    findPersonByID(owed.uid)!.owed = roundToDecimal(newOwedValue);
    findPersonByID(owee.uid)!.owed = roundToDecimal(newOweeValue);

    logTransactions(owed, owee, transactionAmount);
  };

  const logTransactions = (owed: DibbyParticipant, owee: DibbyParticipant, amount: number) => {
    const roundedAmount = roundToDecimal(amount);
    const string = `💰 ${owee.name} owes ${owed.name}: $${roundedAmount} 💰`;
    returnThis.transactions.push({ owee, owed, amount: roundedAmount });
    numberOfTransactions = numberOfTransactions + 1;
  };

  //   const expenseAmounts = trip.expenses.map((exp) => {
  //     calculatePerPersonPerExpense(exp);
  //     calculateTotalPaidByPerson(exp);
  //     return exp.amount;
  //   });

  //   calculatePerTotal(expenseAmounts);
  //   trip.travelers.map((person) => {
  //       return calculateOwedPerPerson(person);
  //   });
  zeroOut(0);
  const finalString = `
   💰 This trip's expenses were paid for in ${numberOfTransactions} transactions 👍
    `;
  returnThis.finalNumberOfTransactions = numberOfTransactions;
  return returnThis;
};

export const getTransactionString = (transaction: ITransactions): string => {
    return `💰 ${transaction.owee.name} owes ${transaction.owed.name}: $${numberWithCommas(transaction.amount.toString())}`
}

export const getAmountOfTransactionsString = (numberOfTransactions: number): string => {
return ` Number of transactions: ${numberOfTransactions}`
}


export const checkResults = (ogTrip: DibbyTrip, finalTransactions: ITransactions[]): boolean => {
    finalTransactions.forEach((t) => {
        //
    })

    
    ogTrip.expenses.forEach((e) => {
        // each expense -> go through each traveler in the expense 
        // if payer -> 
        // if not payer -> 
        // each traveler in the expense should 
    }) 
    return true;
}   

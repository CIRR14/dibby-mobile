import { Trip, Expense, Traveler } from "../constants/DibbyTypes";

export interface ITransactions {
    owed: Traveler, 
    owee: Traveler, 
    amount: number
}

export interface ITransactionResponse {
    transactions: ITransactions[],
    finalNumberOfTransactions: number
}


const inRange = (x: number, min: number, max: number): boolean => {
  return (x - min) * (x - max) <= 0;
};

const roundToDecimal = (number: number, decimals = 2): number => {
  return +number.toFixed(decimals);
};

export const calculateTrip = (
  trip: Trip
): ITransactionResponse => {
  let numberOfTransactions = 0;
  let returnThis: ITransactionResponse = {
    transactions: [],
    finalNumberOfTransactions: 0,
  };

  const findPersonByID = (id: string): Traveler | undefined => {
    return trip.travelers.find((p) => p.id === id);
  };

  const calculatePerTotal = (expenseAmounts: number[]): void => {
    const expenseTripTotal = expenseAmounts.reduce((partialSum, a) => partialSum + a, 0);
    trip.perPerson = expenseTripTotal / trip.travelers.length;
  };

  const calculatePerPersonPerExpense = (expense: Expense): void => {
    if (expense.equal) {
      expense.perPerson = (expense.amount as number) / trip.travelers.length;
    } else {
      console.log("expenses are not equal");
    }
  };

  const calculateTotalPaidByPerson = (expense: Expense) => {
    const personWhoPaid = findPersonByID(expense.payer);
    if (personWhoPaid) {
      personWhoPaid.amountPaid = personWhoPaid?.amountPaid + (expense?.amount as number);
    }
  };

  const calculateOwedPerPerson = (person: Traveler) => {
    const tripPerson = findPersonByID(person.id);
    if (tripPerson) {
      tripPerson.owed = tripPerson.amountPaid - trip.perPerson;
    }
  };

  const zeroOut = () => {
    // TODO: memoization
    const getOwedArray = trip.travelers.map((p) => roundToDecimal(p.owed));
    const didEveryonePay = getOwedArray.every((item) => {
      return inRange(item, -0.01, 0.01);
    });

    if (didEveryonePay) {
      return;
    }

    const getHighestOrLowestOwed = (amount: number): Traveler => {
      return trip.travelers[getOwedArray.indexOf(amount)];
    };

    const highestAmount: number = Math.max(...getOwedArray);
    const lowestAmount: number = Math.min(...getOwedArray);

    const highestOwed: Traveler = getHighestOrLowestOwed(highestAmount);
    const lowestOwed: Traveler = getHighestOrLowestOwed(lowestAmount);

    updateOwedColumn(highestOwed, lowestOwed);
    zeroOut();
  };

  const updateOwedColumn = (owed: Traveler, owee: Traveler) => {
    // memoization for efficiecy
    let newOwedValue = 0;
    let newOweeValue = 0;
    let transactionAmount = 0;
    if (owed.owed >= Math.abs(owee.owed)) {
      // make owee 0 and owed the subtraction
      transactionAmount = Math.abs(owee.owed);
      newOwedValue = roundToDecimal(owed.owed - Math.abs(owee.owed));
      findPersonByID(owee.id)!.amountPaid = roundToDecimal(owee.amountPaid - owee.owed);
      findPersonByID(owed.id)!.amountPaid = roundToDecimal(owed.amountPaid + owee.owed);
    } else if (owed.owed < Math.abs(owee.owed)) {
      // make owed 0 and owee the addition
      transactionAmount = owed.owed;
      newOweeValue = owee.owed + owed.owed;
      findPersonByID(owee.id)!.amountPaid = roundToDecimal(owee.amountPaid + owed.owed);
      findPersonByID(owed.id)!.amountPaid = roundToDecimal(owed.amountPaid - owed.owed);
    } else {
      console.log("anomaly");
    }
    findPersonByID(owed.id)!.owed = roundToDecimal(newOwedValue);
    findPersonByID(owee.id)!.owed = roundToDecimal(newOweeValue);

    logTransactions(owed, owee, transactionAmount);
  };

  const logTransactions = (owed: Traveler, owee: Traveler, amount: number) => {
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
  zeroOut();
  const finalString = `
   💰 This trip's expenses were paid for in ${numberOfTransactions} transactions 👍
    `;
  returnThis.finalNumberOfTransactions = numberOfTransactions;
  return returnThis;
};

export const getTransactionString = (transaction: ITransactions): string => {
    return `💰 ${transaction.owee.name} owes ${transaction.owed.name}: $${transaction.amount.toFixed(2)}`
}

export const getAmountOfTransactionsString = (numberOfTransactions: number): string => {
return ` Number of transactions: ${numberOfTransactions}`
}


export const checkResults = (ogTrip: Trip, finalTransactions: ITransactions[]): boolean => {
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

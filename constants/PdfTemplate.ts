import { getTravelerFromId, numberWithCommas } from "../helpers/AppHelpers"
import { ITransactionResponse, ITransactions, getAmountOfTransactionsString, getTransactionString } from "../helpers/DibbyLogic"
import { timestampToString } from "../helpers/TypeHelpers"
import { Expense, Traveler, Trip } from "./DibbyTypes"

export const generateHTML = (transactions: ITransactionResponse, trip: Trip): string => {
    
    return ` <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
<style>
  table.pdfTable {
    width: 100%;
    background-color: #ffffff;
    border-collapse: collapse;
    border-width: 4px;
    border-color: #ffffff;
    border-style: solid;
    color: #000000;
  }
  
  table.pdfTable td, table.pdfTable th {
    border-width: 4px;
    border-color: #ffffff;
    border-style: solid;
    padding: 4px;
  }
  
  table.pdfTable thead {
    background-color: #6abf69;
    color: #ffff
  }
  </style>
    
    </head>
    <body style="text-align: center; font-family: Helvetica Neue">
      <h1 style="font-size: 24px; font-family: Helvetica Neue; font-weight: bold;">
        ${trip.name}
      </h1>
      <h4 style="font-size: 12px; font-family: Helvetica Neue; font-weight: normal;">
      ${timestampToString(trip.created)}
      </h4>
      <h4 style="font-size: 12px; font-family: Helvetica Neue; font-weight: normal;">
      $${numberWithCommas(trip.amount.toString())}
      </h4>
      <h4 style="font-size: 12px; font-family: Helvetica Neue; font-weight: normal;">
      Per Person Average: $${numberWithCommas(trip.perPerson.toString())}
      </h4>

      <div style="text-align: left; margin-top: 24px;" name="transactions">
        <h4 style="font-size: 16px; font-family: Helvetica Neue; font-weight: bold; text-decoration: underline;"> ${getAmountOfTransactionsString(transactions.finalNumberOfTransactions)} </h4>
        <ul style="list-style: none; padding-left: 0;">
        ${transactions.transactions.map((t) => generateTransactions(t)).toString().replace(/,/g, '')}
        </ul>
        </div>

        <hr>

      <div style="text-align: left; margin-top: 24px;" name="travelers">
      <h4 style="font-size: 16px; font-family: Helvetica Neue; font-weight: bold; text-decoration: underline;">
        Travelers
      </h4>
      <table class="pdfTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Owes/Is Owed</th>
            <th>Amount</th>
            <th>Has Paid</th>
            <th> Total Spent </th>
          </tr>
        </thead>
        <tbody>
        ${trip.travelers.map((t) => generateTravelersTable(t)).toString().replace(/,/g, '')}
        <tr style="background-color: #f8f9fa" >
        <td></td>
        <td></td>
        <td style="font-weight: bold; color: ${Math.abs(getTotalOwed(trip.travelers)) > 0.01 ? '#952320' : '#168e48'}"> $${numberWithCommas(getTotalOwed(trip.travelers).toString())} </td>
        <td></td>
        <td></td>
        </tr>
        </tbody>
      </table>
    </div>

    <hr>

    <div style="text-align: left; margin-top: 24px;" name="expenses">
      <h4 style="font-size: 16px; font-family: Helvetica Neue; font-weight: bold; text-decoration: underline;">
        Expenses
      </h4>
      <table class="pdfTable">
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Cost</th>
            <th>Payer</th>
            <th>Involved</th>
          </tr>
        </thead>
        <tbody>
        ${trip.expenses.map((e) => generateExpensesTable(e, trip)).toString().replace(/,/g, '')}
        </tbody>
      </table>
    </div>
    </body>
  </html>`
}

const generateTransactions = (transaction: ITransactions): string => {
    return `<li>${getTransactionString(transaction)}</li>`
}

const generateTravelersTable = (traveler: Traveler) => {
  const totalPaid = numberWithCommas(Math.abs(traveler.owed - traveler.amountPaid).toString())
    return `<tr>
    <td>${traveler.name}</td>
    <td style="color: ${traveler.owed > 0 ? '#1e4d87' : traveler.owed < 0 ? '#952320' : '#168e48'}">${traveler.owed > 0 ? "is owed" : traveler.owed < 0 ? "owes" : "does not owe"}</td>
    <td style="color: ${traveler.owed > 0 ? '#1e4d87' : traveler.owed < 0 ? '#952320' : '#168e48'}">$${numberWithCommas(Math.abs(traveler.owed).toString())}</td>
    <td>$${numberWithCommas(traveler.amountPaid.toString())}</td>
    <td>$${totalPaid}</td>
  </tr>`

}

const generateExpensesTable = (expense: Expense, trip: Trip) => {
    return `<tr>
    <td>${expense.name}</td>
    <td>${timestampToString(expense.created)}</td>
    <td>$${numberWithCommas(expense.amount.toString())}</td>
    <td>${getTravelerFromId(trip, expense.payer)?.name}</td>
    <td>${expense.peopleInExpense.map((uid) => getTravelerFromId(trip, uid)?.name).join('&comma; ')}</td>
  </tr>`
}

const getTotalOwed = (travelers: Traveler[]): number => {
  return travelers.map((t) =>  t.owed).reduce((x, y) => x + y)
}
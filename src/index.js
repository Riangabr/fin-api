const express = require('express')
const { v4: uuidv4 } = require('uuid')
const app = express()

app.use(express.json())

const customers = []

function verifyExitsAccountCpf(req, res, next) {
  const { cpf } = req.headers;

  const customer = customers.find(customer => customer.cpf === cpf);

  if (!customer) {
    return res.status(400).json({ message: 'Custumer not found!' })
  }

  req.customer = customer;

  next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
  if (operation.type === 'credit') {
    return acc + operation.amount;
  } else {
    return acc- operation.amount;
  } 
  }, 0)
  return balance;
}


app.post('/account', (req, res) => {
  const { cpf, name } = req.body

  const customersAlreadyExists = customers.some(
    customer => customer.cpf === cpf
  )
  if (customersAlreadyExists) {
    return res.status(400).json({
      message: "Customer already exists!"
    })
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  })
  console.log(customers);

  return res.status(201).json({
    message: "Customer created Sucess"
  })
})

app.get('/account', verifyExitsAccountCpf, (req, res) => {
  const { customer } = req;

  return res.json({
    message: 'Success',
    customer
  })

})

app.patch('/account', verifyExitsAccountCpf, (req, res) => {
  const { customer } = req;
  const { name } = req.body;

  customer.name = name;

  return res.json({ message: 'Account updated!' });
})
app.delete('/account', verifyExitsAccountCpf, (req, res) => {


  const { customer } = req;

  customers.splice(customer, 1);

  return res.json({
    message: 'Account deleted!',
    customers
  });


})

app.get('/statement', verifyExitsAccountCpf, (req, res) => {
  const { customer } = req;
  return res.json({
    message: 'Sucess',
    statement: customer.statement
  });
})

app.get('/statement/date', verifyExitsAccountCpf, (req, res) => {
const { customer } = req;
const { date } = req.query;

const dateFormat = new Date(date + "00:00");

const statement = customer.statement.filter(
  (statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString()
)

return res.json(statement);
})
app.post('/deposit', verifyExitsAccountCpf, (req, res) => {
 const { customer } = req;

 const { amount, description } = req.body;

 const statementOperation = {
  amount,
  description,
  created_at: new Date(),
  type:'credit'
 }
 customer.statement.push(statementOperation);

 return res.status(201).json ({ message: 'Sucessfully deposited' })
})

app.post('/withdraw', verifyExitsAccountCpf, (req, res) => {
  const{customer} = req;
  const{amount} = req.body;

  const balance = getBalance(customer.statement);

  if(balance < amount ) {
    return res.status(400).json({ message: 'Insufficient funds!'});
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: 'debit'
  }

  customer.statement.push(statementOperation);

  return res.status(201).json({ message: 'Sucessfully withdraw' });
})

app.get('/balance', verifyExitsAccountCpf, (req, res) => {
  const { customer } = req;

  const balance = getBalance(customer.statement);

  return res.json({message: 'Sucess!', balance});
})


app.listen(3333)

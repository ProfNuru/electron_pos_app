const electron = require('electron');
const path = require('path');
const fs = require('fs');
const { callbackify } = require('util');
const sqlite3 = require('sqlite3').verbose();


class Database{
  constructor(db_uri="pos_database.db") {
    const URI = (electron.app || electron.remote.app).getPath('userData');
    this.DATABASE = path.join(URI, db_uri);

    // Connect to database
    this.DB_CONN = new sqlite3.Database(this.DATABASE, (err)=>{
        if(err){
            console.error(err.message);
        }
        console.log('Connected to the POS database.', this.DATABASE);
    });

    // Set up tables if they don't exist
    this.DB_CONN.serialize(()=>{
      // Users table: user_id, first_name, last_name, email, contact, password_hash, clearance_level

      console.log("Setting up users table");
      let user_qry = "CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY,"+
                    "first_name TEXT NOT NULL UNIQUE,"+
                    "last_name TEXT NOT NULL UNIQUE,"+
                    "email TEXT NOT NULL,"+
                    "contact TEXT NOT NULL,"+
                    "hash BLOB NOT NULL,"+
                    "date_added TEXT NOT NULL"+
                  ")";
      this.DB_CONN.run(user_qry);

      // Items table: item_id, item, description, available_qty, cost_unit_price, 
      // selling_unit_price, cost_bulk_price, selling_bulk_price, bulk_qty, date_added
      console.log("Setting up items table");
      let item_qry = "CREATE TABLE IF NOT EXISTS items (item_id INTEGER PRIMARY KEY,"+
                    "item TEXT NOT NULL UNIQUE,"+
                    "description TEXT,"+
                    "available_qty INTEGER NOT NULL,"+
                    "cost_unit_price NUMERIC NOT NULL,"+
                    "selling_unit_price NUMERIC NOT NULL,"+
                    "cost_bulk_price NUMERIC,"+
                    "selling_bulk_price NUMERIC,"+
                    "bulk_qty INTEGER,"+
                    "date_added TEXT NOT NULL"+
                  ")";
      this.DB_CONN.run(item_qry);

      // Customers table: customer_id, name, physical_address, gps_address, contact,
      // num_of_sales, total_amt_of_sales
      console.log("Setting up customers table");
      let cust_qry = "CREATE TABLE IF NOT EXISTS customers (customer_id INTEGER PRIMARY KEY,"+
                    "name TEXT NOT NULL UNIQUE,"+
                    "physical_address TEXT,"+
                    "gps_address TEXT,"+
                    "contact TEXT NOT NULL,"+
                    "num_of_sales INTEGER NOT NULL,"+
                    "total_amt_of_sales NUMERIC NOT NULL,"+
                    "date_added TEXT NOT NULL"+
                  ")";
      this.DB_CONN.run(cust_qry);

      // Invoices table: invoice_id, customer_id, date, cash_sale?, num_of_items, sub_total, 
      // discount, grand_total
      console.log("Setting up invoices table");
      let inv_qry = "CREATE TABLE IF NOT EXISTS invoices (invoice_id INTEGER PRIMARY KEY,"+
                    "customer_id INTEGER NOT NULL,"+
                    "cash INTEGER NOT NULL,"+ // Boolean (0,1)
                    "num_of_items INTEGER NOT NULL,"+
                    "sub_total NUMERIC NOT NULL,"+
                    "discount NUMERIC NOT NULL,"+
                    "grand_total NUMERIC NOT NULL,"+
                    "date TEXT NOT NULL,"+
                    "FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE CASCADE ON UPDATE NO ACTION"+
                  ")";
      this.DB_CONN.run(inv_qry);

      // Sales table: sale_id, invoice_id, item_id, unit_price, qty  
      console.log("Setting up sales table");
      let sales_qry = "CREATE TABLE IF NOT EXISTS sales (sale_id INTEGER PRIMARY KEY,"+
                    "invoice_id INTEGER NOT NULL,"+
                    "item_id INTEGER NOT NULL,"+
                    "unit_price NUMERIC NOT NULL,"+
                    "qty INTEGER NOT NULL,"+
                    "FOREIGN KEY (invoice_id) REFERENCES invoices (invoice_id) ON DELETE CASCADE ON UPDATE NO ACTION,"+
                    "FOREIGN KEY (item_id) REFERENCES items (item_id) ON DELETE CASCADE ON UPDATE NO ACTION"+
                  ")";
      this.DB_CONN.run(sales_qry);

      // Paid debts table: invoice_id, customer_id, date, cash_sale?, num_of_items, sub_total, 
      // discount, grand_total
      console.log("Setting up paid_debts table");
      let pdebts_qry = "CREATE TABLE IF NOT EXISTS paid_debts (paid_debts_id INTEGER PRIMARY KEY,"+
                    "customer_id INTEGER NOT NULL,"+
                    "amount_paid NUMERIC NOT NULL,"+
                    "payment_date TEXT NOT NULL,"+
                    "FOREIGN KEY (customer_id) REFERENCES customers (customer_id) ON DELETE CASCADE ON UPDATE NO ACTION"+
                  ")";
      this.DB_CONN.run(pdebts_qry);
    });  
  }

  // Close database connection
  close(){
    this.DB_CONN.close((err)=>{
      if(err){
        return console.error(err);
      }
      console.log('Database connection closed')
    })
  }

  // Get items
  get_data(table, post_fetch){
    console.log("Getting",table);
    let sql = `SELECT * FROM ${table}`;
    let all_items = [];
    
    try{
      this.DB_CONN.all(sql, function(err, rows) {
        if(err){
          console.error(err);
        }else{
          rows.forEach(function (row) {
            let obj = {}
            for(var i = 0; i<Object.keys(row).length; i++){
              obj[Object.keys(row)[i]] = row[Object.keys(row)[i]]
            }
            all_items.push(obj);
          });
          let data = {table:table,data:all_items};
          post_fetch(data);
        }
      });
    }catch (err){
      console.log("Error getting items", err);
      post_fetch(err);
    }
  }
  
  // Get record
  subtract_item_qty(record_id,qty){
    let sql = `UPDATE items SET available_qty = available_qty - ${qty} WHERE item_id = ${record_id}`;
    try {
      this.DB_CONN.run(sql, function(err){
        if(err){
          console.log(err);
        }else{
          console.log("Updated item qty after sales:",this);
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Insert invoice
  record_invoice(new_invoice, cb){
    let sql = `INSERT INTO invoices(customer_id,cash,num_of_items,sub_total,discount,grand_total,date) 
                VALUES (?,?,?,?,?,?,?)`;
    
    try {
      this.DB_CONN.run(sql,
        new_invoice.customer_id, new_invoice.cash, new_invoice.num_of_items,
        new_invoice.sub_total, new_invoice.discount, new_invoice.grand_total, 
        new_invoice.date,
        function(err){
          if(err){
            console.log(err);
          }else{
            cb(this.lastID)
          }
        });
    } catch (err) {
      console.log(err);
    }
  }

  // Record sales
  record_sales(items, cb){
    // Sales table: sale_id, invoice_id, item_id, unit_price, qty 
    let inv_id = items.invoice_id;
    let inv_items = items.cart_items;
    let qry = "INSERT INTO sales (invoice_id, item_id, unit_price, qty) VALUES (?,?,?,?)";
    let statement = this.DB_CONN.prepare(qry);

    this.DB_CONN.serialize(()=>{
      for (var i = 0; i < inv_items.length; i++) {
        statement.run([inv_id,inv_items[i].item_id,inv_items[i].selling_unit_price,inv_items[i].qty], function (err) { 
            if(err){
              console.log(err);
              throw err;
            }else{
              console.log("Sales recorded");
            }
        });
        this.subtract_item_qty(inv_items[i].item_id, inv_items[i].qty);
      }
    });

    statement.finalize();
    cb(true);
  }

  // Record customer history (num_of_sales, total_amt_of_sales)
  increase_customer_purchase(c_id,amt){
    let sql = `UPDATE customers SET num_of_sales = num_of_sales + ${1}, 
              total_amt_of_sales = total_amt_of_sales + ${amt}  WHERE customer_id = ${c_id}`;
    try {
      this.DB_CONN.run(sql, function(err){
        if(err){
          console.log(err);
          return false;
        }else{
          return true;
        }
      });
    } catch (error) {
      throw error;
    }
  }
}

// expose the class
module.exports = Database;

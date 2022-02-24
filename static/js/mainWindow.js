const ITEMS = window.api.ITEMS;
const CUSTOMERS = window.api.CUSTOMERS;
const SALES = window.api.SALES;
const INVOICES = window.api.INVOICES;
const PAID_DEBTS = window.api.PAID_DEBTS;
const CART = window.api.CART;
const SETTINGS = window.api.SETTINGS;
const storage_tables = [ITEMS,CUSTOMERS,SALES,INVOICES,PAID_DEBTS,CART,SETTINGS];
// Global variables
const wrapper = document.getElementById("wrapper");
const side_nav_tabs = document.getElementsByClassName("side-nav-tabs");
const reload_window_btn = document.getElementById("reload-window-btn");

// DASHBOARD Variables
const daily_net_total = document.getElementById("daily-net-total");
const daily_gross_sales = document.getElementById("daily-gross-sales");
const reset_chart = document.getElementById('reset-chart');
const revenue_chart = document.getElementById('revenue-chart');
const products_pie_chart = document.getElementById('products-pie-chart');
const top_sales_bar_graph = document.getElementById('product-sales-bar-graph');
const currency_symbols = document.getElementsByClassName("currency");
const daily_qty_sold = document.getElementById("daily-qty-sold");
const total_qty_in_stock = document.getElementById("total-qty-in-stock");
const total_receivables = document.getElementById("total-receivables");

// Charts
let daily_sales;
let productsPieChart;
let top_sales;

// POS Variables
const search_item_field = document.getElementById('search-item-field');
const add_to_cart_btn = document.getElementById('add-to-cart-btn');
const item_suggestions = document.getElementById("item-suggestions");
const toggle_customer_suggestions_btn = document.getElementById("toggle-cust-suggestions");
const toggle_item_suggestions_btn = document.getElementById("toggle-item-suggestions");
const search_customer_field = document.getElementById("search-customer-field");
const customer_contact_field = document.getElementById("customer-contact");
const customer_address_field = document.getElementById("customer-address");
const discount_field = document.getElementById("discount-value");
const subtotal_field = document.getElementById("subtotal-amount");
const grandtotal_field = document.getElementById("grand-total-amount");
const clear_cart_btn = document.getElementById("clear-cart-btn");
const complete_sale_btn = document.getElementById("complete-sale-btn");
const checkout_btn = document.getElementById("checkout-btn");
const print_invoice_btn = document.getElementById("print-invoice-btn");
const print_invoice_close_btn = document.getElementById("print-invoice-close-btn");
const inv_count = document.getElementById("inv-count");
const daily_invoices_table_body = document.getElementById("daily-invoices-table-body");

let cash_or_credit_modal = new bootstrap.Modal(document.getElementById("cash-or-credit-modal"));

// Settings Variables
const toggle_login_on_startup = document.getElementById("toggleLogin");
const business_name = document.getElementById("bussiness-name");
const business_address = document.getElementById("bussiness-address");
const business_contact = document.getElementById("bussiness-contact");
const business_currency = document.getElementById("business-currency");
const save_business_details = document.getElementById("save-business-details");
const save_business_currency = document.getElementById("save-business-currency");

if(localStorage.hasOwnProperty('opened_tab')){
  item_suggestions.style.display = "none";
  let opened_tab = localStorage.getItem('opened_tab');
  var tab_element = document.querySelector("#"+opened_tab);
  tab_element.click();
}

let tables_fetched = window.api.sendSynchronousIPC('start_loading');
if(tables_fetched){
  for(var s=0; s<storage_tables.length; s++){
    if(!(localStorage.hasOwnProperty(storage_tables[s]))){
      localStorage.setItem(storage_tables[s],JSON.stringify([]));
    }
  }
}

window.api.receiveSignalWithObj('loading_items', load_local_storage_items);

// Set Daily chart date to today
reset_chart.valueAsDate = new Date();

// Load saved settings
load_saved_settings();

window.api.updateSetting('update_login_on_startup_settings',load_saved_settings);
window.api.updateSetting('profile_updated',load_saved_settings);

// EVENTS
  // Global Events
wrapper.addEventListener("click", close_dropdowns);
reload_window_btn.addEventListener("click", reload_window);
for(var i=0; i<side_nav_tabs.length; i++){
  side_nav_tabs[i].addEventListener("click", save_opened_tab);
}
  // Dashboard Events
  

  // POS Events
toggle_customer_suggestions_btn.addEventListener("click", toggle_customer_suggestions);
toggle_item_suggestions_btn.addEventListener("click", toggle_item_suggestions);
search_customer_field.addEventListener("keyup", filter_customer_suggestions);
search_item_field.addEventListener("keyup", filter_item_suggestions);
add_to_cart_btn.addEventListener("click", add_item_to_cart);
discount_field.addEventListener("keyup", give_discount);
clear_cart_btn.addEventListener("click", clear_cart);
checkout_btn.addEventListener("click", sale_checkout);
complete_sale_btn.addEventListener("click", select_sale_type);
print_invoice_btn.addEventListener("click", print_invoice_from_modal);
print_invoice_close_btn.addEventListener("click", close_print_invoice_modal);

  // Settings Events
toggle_login_on_startup.addEventListener("click", ()=>{
  window.api.sendUpdate("set_login_on_startup",toggle_login_on_startup.checked);
  notification_msg("success", "Startup Login", "Startup login set to "+toggle_login_on_startup.checked);
});
save_business_details.addEventListener("click", save_business_profile);
save_business_currency.addEventListener("click", save_new_currency);

// GLOBAL
function load_dashboard_page(){
  // Start Clock
  init_clock();

  // Revenue chart
  draw_daily_sales_chart(reset_chart.value);

  // Products Pie Chart
  draw_product_sales_pie_chart(reset_chart.value);

  // Top Sales Bar Graph
  draw_top_sales_bar_graph();

  // Load Items to Table
  load_all_items();
  
  // Load Customers to Table
  load_all_customers();

}

function load_sales_page(){
  let CURR = value => window.api.getCurrency(value);

  // Load Item Suggestions
  load_item_suggestions();

  // Load Customers Suggestions
  load_customers_suggestions();

  // Load Cart Items on select
  load_cart_items(CURR);
}

function close_dropdowns(e){
  let isItemSuggestion = document.getElementById("item-suggestions");
  let isCustomerSuggestion = document.getElementById("customer-suggestions");
  if(!toggle_item_suggestions_btn.contains(e.target)){
    if(!isItemSuggestion.contains(e.target)){
      if(isItemSuggestion.style.display != "none"){
        isItemSuggestion.style.display = "none";
      }
    }
  }
  if(!toggle_customer_suggestions_btn.contains(e.target)){
    if(!isCustomerSuggestion.contains(e.target)){
      if(isCustomerSuggestion.style.display != "none"){
        isCustomerSuggestion.style.display = "none";
      }
    }
  }
  e.target.focus();
}

// DASHBOARD Functions
function update_clock(){
    var now = new Date();
    var dname = now.getDay(),
        mo = now.getMonth(),
        dnum = now.getDate(),
        yr = now.getFullYear(),
        hr = now.getHours(),
        min = now.getMinutes(),
        sec = now.getSeconds(),
        pe = "AM";

    if(hr == 0){
        hr = 12;
    }
    if(hr > 12){
        hr = hr-12;
        pe = 'PM';
    }

    Number.prototype.pad = function(digits){
        for(var n=this.toString(); n.length<digits; n=0+n);
            return n;
    }

    var months = ["January","February","March","April",
                "May","June","July","August","September",
                "October","November","December"];
    var week = ["Sunday","Monday","Tuesday","Wednesday",
                "Thursday","Friday","Saturday"];
    var ids = ["date-day","date-month","date-num",
                "date-year","hour","minutes","seconds","period"];
    var values = [week[dname], months[mo], dnum.pad(2), yr, hr.pad(2), min.pad(2), sec.pad(2), pe];

    for(var i=0; i<ids.length; i++){
        document.getElementById(ids[i]).firstChild.nodeValue = values[i];
    }
}

function init_clock(){
    update_clock();
    setInterval(update_clock, 1000);
}

// Draw Daily Sales chart
function draw_daily_sales_chart(current_date){
  if(daily_sales){
    daily_sales.destroy();
  }
  let invoices = JSON.parse(localStorage.getItem(INVOICES));
  let count = 0;
  let labels = [];
  let values = [];
  let gross_total_sales = 0;
  let net_total_sales = 0;
  let sub_gross_total_sales = 0;
  let sub_net_total_sales = 0;
  let receivables = 0;
  let num_of_invoices = 0;
  
  daily_invoices_table_body.innerHTML = "";
  for(var i=0; i<invoices.length; i++){
    gross_total_sales = window.api.addCurrencies(gross_total_sales,invoices[i].sub_total);
    net_total_sales = window.api.addCurrencies(net_total_sales,invoices[i].grand_total);
    
    if(new Date(current_date) - new Date(parseInt(invoices[i].date)) < 0){
      num_of_invoices += 1;
      sub_gross_total_sales = window.api.addCurrencies(sub_gross_total_sales,invoices[i].sub_total);
      sub_net_total_sales = window.api.addCurrencies(sub_net_total_sales,invoices[i].grand_total);
      count+=1;
      labels.push(count);
      values.push(invoices[i].sub_total);

      // Load daily invoice table
      daily_invoices_table_body.innerHTML += "<tr>"+
                                                "<th scope='row'>"+num_of_invoices+"</th>"+
                                                "<td>"+(invoices[i].customer_id > 0 ? find_customer(invoices[i].customer_id).name : "")+"</td>"+
                                                "<td>"+(invoices[i].cash==1 ? "CASH":"CREDIT")+"</td>"+
                                                "<td>"+window.api.currency(invoices[i].grand_total)+"</td>"+
                                              "</tr>";
    }
    if(invoices[i].cash){
      receivables = window.api.addCurrencies(receivables,invoices[i].grand_total);
    }
  }

  inv_count.innerText = num_of_invoices == 1 ? `${num_of_invoices} Invoice`: `${num_of_invoices} Invoices`;
  daily_net_total.innerText = window.api.currency(sub_net_total_sales);
  daily_gross_sales.innerText = window.api.currency(sub_gross_total_sales);
  total_receivables.innerText = window.api.currency(receivables);
  
  const data = {
      labels: labels,
      datasets: [{
          label: "Sales",
          backgroundColor: "rgb(255,99,132)",
          borderColor: "rgb(255, 99, 132)",
          data: values
      }]
  }
  const config = {
    type: 'line',
    data: data,
    labels: labels,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          title: {
              display: true,
              text: "DAILY SALES",
              align: 'start'
          }
      }
    }
  };
  try {
    daily_sales = new Chart(revenue_chart,config);
  } catch (error) {
    console.log("Create chart failed:",error);
  }
}

// Draw Products Pie Chart
function draw_product_sales_pie_chart(current_date){
  if(productsPieChart){
    productsPieChart.destroy();
  }
  let all_items = JSON.parse(localStorage.getItem(ITEMS));
  let all_sales = JSON.parse(localStorage.getItem(SALES));
  let all_invoices = JSON.parse(localStorage.getItem(INVOICES));
  let some_sales = [];
  let sale_counts = {};
  let item_names = [];
  let total_sales = [];
  let qty_sold = 0;

  // Update Inventory summary card
  for(var i=0; i<all_invoices.length; i++){
    if(new Date(current_date) - new Date(parseInt(all_invoices[i].date)) < 0){
      for(var j=0;j<all_sales.length;j++){
        qty_sold += all_sales[j].qty;
        if(all_sales[j].invoice_id === all_invoices[i].invoice_id){
          some_sales.push(all_sales[j]);
        }
      }
    }
  }

  for(var j=0;j<some_sales.length; j++){
    if (!sale_counts[some_sales[j].item_id]){ 
      sale_counts[some_sales[j].item_id] = 0;  
    }
    var item_amt_sold = window.api.multiplyCurrencies(some_sales[j].qty,some_sales[j].unit_price);
    sale_counts[some_sales[j].item_id] = window.api.addCurrencies(sale_counts[some_sales[j].item_id],item_amt_sold);
  }
  
  let entries = Object.entries(sale_counts);
  for(var k=0;k<entries.length; k++){
    var pdt = find_item(parseInt(entries[k][0]));
    item_names.push(pdt.item);
    total_sales.push(entries[k][1]);
  }
  daily_qty_sold.innerText = qty_sold.toString();
  
  const data = {
    labels: item_names,
    datasets: [{
      label: 'My First Dataset',
      data: total_sales,
      backgroundColor: [
        'rgb(255, 99, 132)',
        'rgb(54, 162, 235)',
        'rgb(255, 205, 86)'
      ],
      hoverOffset: 4
    }]
  };
  const config = {
    type: 'pie',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          title: {
              display: true,
              text: "Sales Breakdown by Products",
              align: 'start'
          },
          legend: {
              position: 'bottom'
          }
      }
    }
  };
  try {
    productsPieChart = new Chart(products_pie_chart,config);
  } catch (error) {
    console.log("Create chart failed:",error);
  }
}

function draw_top_sales_bar_graph(){
  if(top_sales){
    top_sales.destroy();
  }
  let all_items = JSON.parse(localStorage.getItem(ITEMS));
  let item_names = [];
  let item_qties = [];
  for(var i=0; i<all_items.length; i++){
    item_names.push(all_items[i].item);
    item_qties.push(all_items[i].available_qty);
  }
  const data = {
    labels: item_names,
    datasets: [{
      label: 'Items In Stock',
      data: item_qties,
      backgroundColor: [
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(201, 203, 207, 0.2)'
      ],
      borderColor: [
        'rgb(255, 99, 132)',
        'rgb(255, 159, 64)',
        'rgb(201, 203, 207)'
      ],
      borderWidth: 1
    }]
  };

  const config = {
    type: 'bar',
    data: data,
    options: {
      scales: {
        y: {
          beginAtZero: true
        }
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
          title: {
              display: true,
              text: "Items In Stock",
              align: 'start'
          },
          legend: {
              display:false
          }
      }
    },
  };
  try {
    top_sales = new Chart(top_sales_bar_graph,config);
  } catch (error) {
    console.log("Create chart failed:",error);
  }
}

//Load Items
function load_all_items(){
  const items_table = document.getElementById("items-table-body");
  const all_items = JSON.parse(localStorage.getItem(ITEMS));
  items_table.innerHTML = "";
  let qty_avail = 0
  for(var i=0; i<all_items.length; i++){
    qty_avail += all_items[i].available_qty;
    items_table.innerHTML += "<tr><th scope='row'>"+all_items[i].item_id+"</th>"+
                              "<td>"+all_items[i].item+"</td>"+
                              "<td>"+all_items[i].description+"</td>"+
                              "<td>"+all_items[i].available_qty+"</td>"+
                              "<td style='text-align:right'>"+window.api.currency(all_items[i].selling_unit_price)+"</td>"+
                              "</tr>";
  }
  total_qty_in_stock.innerText = qty_avail.toString();
}

//Load Customers to Table
function load_all_customers(){
  const customers_table = document.getElementById("customers-table-body");
  const all_customers = JSON.parse(localStorage.getItem(CUSTOMERS));
  customers_table.innerHTML = "";
  for(var i=0; i<all_customers.length; i++){
    customers_table.innerHTML += "<tr><th scope='row'>"+all_customers[i].customer_id+"</th>"+
                                    "<td>"+all_customers[i].name+"</td>"+
                                    "<td>"+all_customers[i].physical_address+"</td>"+
                                    "<td>"+all_customers[i].contact+"</td>"+
                                    "<td>"+all_customers[i].num_of_sales+"</td>"+
                                    "<td style='text-align:right'>"+window.api.currency(all_customers[i].total_amt_of_sales)+"</td>"+
                                  "</tr>";
  }
}

// POS Functions
// Load Item Suggestions
function load_item_suggestions(filter=""){
  if(localStorage.hasOwnProperty(ITEMS)){
    const all_items = JSON.parse(localStorage.getItem(ITEMS));
    const items_dropdown = document.getElementById("suggested-items");
    items_dropdown.innerHTML = "";
    for(var i=0; i<all_items.length; i++){
      if(all_items[i].item.includes(filter)){
        let s = "<li class='item-suggestion'><span class='item_id'>"+
                all_items[i].item_id+"</span> <span class='item'>"+
                all_items[i].item+"</span></li>";
        items_dropdown.innerHTML += s;
      }
    }
    
    let suggestions = document.getElementsByClassName("item-suggestion");
    for(var i=0; i<suggestions.length; i++){
      suggestions[i].addEventListener("click", select_item);
    }

    function select_item(){
      let selected_item_id = parseInt(this.getElementsByClassName("item_id")[0].innerText);
      let selected_item = find_item(selected_item_id);
      search_item_field.value = selected_item_id.toString()+" "+selected_item.item;
      toggle_item_suggestions();
    }
  }
}

// Load Customers Suggestions
function load_customers_suggestions(filter = ""){
  if(localStorage.hasOwnProperty(CUSTOMERS)){
    const all_customers = JSON.parse(localStorage.getItem(CUSTOMERS));
    const customers_dropdown = document.getElementById("suggested-customers");
    customers_dropdown.innerHTML = "";
    for(var i=0; i<all_customers.length; i++){
      if(all_customers[i].name.includes(filter)){
        let cust = "<li class='customer-suggestion'><span class='cust_id'>"+all_customers[i].customer_id.toString()+
                "</span> <span class='cust'>"+all_customers[i].name+"</span></li>";
        customers_dropdown.innerHTML += cust;
      }      
    }

    let suggestions = document.getElementsByClassName("customer-suggestion");
    for(var i=0; i<suggestions.length; i++){
      suggestions[i].addEventListener("click", select_customer);
    }

    function select_customer(){
      let selected_customer_id = parseInt(this.getElementsByClassName("cust_id")[0].innerText);
      let selected_customer = find_customer(selected_customer_id);
      let cust_id_value = document.getElementById("cust-id-value");
      cust_id_value.value = selected_customer_id;
      search_customer_field.value = selected_customer.name;
      customer_contact_field.value = selected_customer.contact;
      customer_address_field.innerText = selected_customer.physical_address;
      toggle_customer_suggestions();
    }

  }
}

function toggle_customer_suggestions(toggle=true){
  const suggestions_div = document.getElementById("customer-suggestions");
  if(toggle){
    if(suggestions_div.style.display != "block"){
      load_customers_suggestions();
      suggestions_div.style.display = "block";
    }else{
      suggestions_div.style.display = "none";
    }
  }else{
    load_customers_suggestions();
    suggestions_div.style.display = "block";
  }  
}

function toggle_item_suggestions(toggle=true){
  const suggestions_div = document.getElementById("item-suggestions");
  if(toggle){
    if(suggestions_div.style.display != "block"){
      load_item_suggestions();
      suggestions_div.style.display = "block";
    }else{
      suggestions_div.style.display = "none";
    }
  }else{
    load_item_suggestions();
    suggestions_div.style.display = "block";
  }  
}

function filter_customer_suggestions(){
  let filter = this.value;
  load_customers_suggestions(filter);
  toggle_customer_suggestions(false);
}

function filter_item_suggestions(){
  let filter = this.value;
  load_item_suggestions(filter);
  toggle_item_suggestions(false);
}

//Load Items to Cart
function load_cart_items(){
  const items_table = document.getElementById("cart-items-table");
  const all_items = JSON.parse(localStorage.getItem(CART));
  items_table.innerHTML = "";
  let sub_total = 0;
  for(var i=0; i<all_items.length; i++){
    sub_total = window.api.addCurrencies(sub_total,all_items[i].sub_total);
    items_table.innerHTML += "<tr><th class='cart-item-id' scope='row'>"+all_items[i].item_id+"</th>"+
                              "<td class='item-name-fields'>"+all_items[i].item+"</td>"+
                              "<td class='window.api.currency-fields'>"+window.api.currency(all_items[i].selling_unit_price)+"</td>"+
                              "<td><span class='minus'><i class='fas fa-minus'></i></span><span class='qty-value'>"+
                              "<input class='qty_values' type='text' value='"+all_items[i].qty.toString()+"'>"+
                              "</span><span class='plus'><i class='fas fa-plus'></i></span></td>"+
                              "<td class='window.api.currency-fields'>"+window.api.currency(all_items[i].sub_total)+"</td>"+
                              "<td style='cursor:pointer;color:darkred;' class='remove-items'><i class='fas fa-times'></i></td>"+
                              "</tr>";
  }

  if(window.api.currencyValue(discount_field.value) <= sub_total){
    var grand_total = window.api.subtractCurrencies(sub_total,window.api.currency(discount_field.value));
    subtotal_field.innerText = CURR(sub_total);
    grandtotal_field.innerText = CURR(grand_total);
  }
  else{
    notification_msg("danger", "Discount Ignored", "Discount exceeds invoice total");
    grandtotal_field.innerText = CURR(sub_total);
  }

  // POS table events
  let plus_qty = document.getElementsByClassName('plus');
  let minus_qty = document.getElementsByClassName('minus');
  let qty_values = document.getElementsByClassName('qty_values');
  let remove_item_btns = document.getElementsByClassName('remove-items');
  
  // POS table Events
  for(var i=0; i<plus_qty.length; i++){
    plus_qty[i].addEventListener("mousedown", increase_qty);
    minus_qty[i].addEventListener("mousedown", decrease_qty);
    qty_values[i].addEventListener("keyup", update_qty);
    remove_item_btns[i].onclick = remove_item;
  }
  
  // POS table functions
  function increase_qty(){
    let row = this.parentElement.parentElement;
    let item_id = this.parentElement.parentElement.getElementsByClassName('cart-item-id')[0].innerText;
    let updated = update_cart_item_qty(parseInt(item_id),'+');
    if(updated.success){
      row.getElementsByClassName('window.api.currency-fields')[1].innerText = window.api.currency(updated.item.sub_total);
      this.previousElementSibling.getElementsByClassName('qty_values')[0].value = updated.item.qty;
      calculate_cart_totals()
    }
  }

  function decrease_qty(){
    let row = this.parentElement.parentElement;
    let item_id = this.parentElement.parentElement.getElementsByClassName('cart-item-id')[0].innerText;
    let updated = update_cart_item_qty(parseInt(item_id),'-');
    if(updated.success){
      if(updated.success){
        row.getElementsByClassName('window.api.currency-fields')[1].innerText = window.api.currency(updated.item.sub_total);
        this.nextElementSibling.getElementsByClassName('qty_values')[0].value = updated.item.qty;
        calculate_cart_totals();
      }
    }
  }

  function update_qty(){
    let row = this.parentElement.parentElement.parentElement;
    let item_id = this.parentElement.parentElement.parentElement.getElementsByClassName('cart-item-id')[0].innerText;
    let value = parseInt(this.value);
    if(!value){
      console.log("Invalid entry for quantity");
      return;
    }else if(value < 0){
      console.log("Quantity must not be signed!");
      return;
    }
    let updated = update_cart_item_qty(parseInt(item_id),'|',value);
    if(updated.success){
      row.getElementsByClassName('window.api.currency-fields')[1].innerText = window.api.currency(updated.item.sub_total);
      calculate_cart_totals();
    }
  }

  function calculate_cart_totals(){
    let new_sub_total;
    let s_total_field = document.getElementById("subtotal-amount");
    let g_total_field = document.getElementById("grand-total-amount");
    const all_items = JSON.parse(localStorage.getItem(CART));
    if(all_items.length === 1){
      new_sub_total = all_items[0].sub_total;
    }else{
      new_sub_total = all_items.reduce((a,b)=>{
        return window.api.addCurrencies(a.sub_total,b.sub_total);
      });
    }
    
    if(window.api.currencyValue(discount_field.value) <= new_sub_total){
      const grand_total = window.api.addCurrencies(new_sub_total,discount_field.value);
      s_total_field.innerText = CURR(new_sub_total);
      g_total_field.innerText = CURR(grand_total);
    }
  }

  function remove_item(){
    let item_id = this.parentElement.getElementsByClassName('cart-item-id')[0].innerText;
    let cart_items = JSON.parse(localStorage.getItem(CART));
    let filtered_cart = cart_items.filter((item)=>{
      return item.item_id !== parseInt(item_id);
    });
    localStorage.setItem(CART,JSON.stringify(filtered_cart));
    load_cart_items();
    notification_msg("danger", "Item Removed From Invoice", "");
  }
}

function clear_cart(){
  let empty_cart = [];
  localStorage.setItem(CART,JSON.stringify(empty_cart));
  load_cart_items();
  search_customer_field.value = "";
  customer_contact_field.value = "";
  customer_address_field.innerText = "";
  subtotal_field.innerText = CURR(0.00);
  discount_field.value = 0;
  notification_msg("danger", "Invoice Cleared", "Invoice is empty");
}

function find_item(id){
  const all_items = JSON.parse(localStorage.getItem(ITEMS));
  for(var i=0; i<all_items.length; i++){
    if(id === all_items[i].item_id){
      return all_items[i];
    }
  }
}

function find_customer(id){
  const all_customers = JSON.parse(localStorage.getItem(CUSTOMERS));
  for(var i=0; i<all_customers.length; i++){
    if(id === all_customers[i].customer_id){
      return all_customers[i];
    }
  }
}

function add_item_to_cart(e){
  e.preventDefault();
  let cart_items = JSON.parse(localStorage.getItem(CART));
  if(!search_item_field.value){
    notification_msg("danger", "No Item Selected", "Select item to add to invoice");
    return;
  }
  let selected_item_id = parseInt(search_item_field.value.split(' ')[0]);
  for(var i=0; i<cart_items.length; i++){
    if(selected_item_id === cart_items[i].item_id){
      notification_msg("danger", "Item Already in Invoice", "you can increase the quantity of the item");
      search_item_field.value = "";
      return;
    }
  }
  let selected_item = find_item(selected_item_id);
  if(selected_item.available_qty <= 0){
    notification_msg("danger", "Out of Stock", `You have run out of item: ${selected_item.item}. Restock NOW!`);
    search_item_field.value = "";
    return;
  }
  selected_item.qty = 1;
  selected_item.sub_total = window.api.currency(selected_item.selling_unit_price);
  cart_items.push(selected_item);
  localStorage.setItem(CART,JSON.stringify(cart_items));
  search_item_field.value = "";
  load_cart_items();
  notification_msg("success", "Item Added", selected_item.item+" added to invoice");
}

function update_cart_item_qty(id, operation, value=0){
  if(operation === '+'){
    const all_items = JSON.parse(localStorage.getItem(CART));
    for(var i=0; i<all_items.length; i++){
      if(id === all_items[i].item_id){
        if(all_items[i].qty >= all_items[i].available_qty){
          notification_msg("danger", "Insufficient Stock", `There is not enough quantity of ${all_items[i].item}`);
          return {success:false, 'item':all_items[i]};
        }
        all_items[i].qty += 1;
        all_items[i].sub_total = window.api.multiplyCurrencies(all_items[i].selling_unit_price,all_items[i].qty);
        localStorage.setItem(CART,JSON.stringify(all_items));
        return {success:true, 'item':all_items[i]};
      }
    }
    return {success:false};
  }else if(operation === '-'){
    const all_items = JSON.parse(localStorage.getItem(CART));
    for(var i=0; i<all_items.length; i++){
      if(id === all_items[i].item_id){
        if(all_items[i].qty > 1){
          all_items[i].qty -= 1;
        }
        all_items[i].sub_total = window.api.multiplyCurrencies(all_items[i].selling_unit_price,all_items[i].qty);
        localStorage.setItem(CART,JSON.stringify(all_items));
        return {success:true, 'item':all_items[i]};
      }
    }
    return {success:false};
  }else if(operation === '|'){
    const all_items = JSON.parse(localStorage.getItem(CART));
    for(var i=0; i<all_items.length; i++){
      if(id === all_items[i].item_id){
        if(value > all_items[i].available_qty){
          notification_msg("danger", "Insufficient Stock", `There is not enough quantity of ${all_items[i].item}`);
          return {success:false, 'item':all_items[i]};
        }
        all_items[i].qty = value;
        all_items[i].sub_total = window.api.multiplyCurrencies(all_items[i].selling_unit_price,all_items[i].qty);
        localStorage.setItem(CART,JSON.stringify(all_items));
        return {success:true, 'item':all_items[i]};
      }
    }
    return {success:false};
  }else{
    console.log("invalid operation");
    return {success:false};
  }
}

function give_discount(e){
  let discount = window.api.currencyValue(this.value);
  if(discount >= 0){
    load_cart_items();
  }
}

function CURR(val,symbol=JSON.parse(localStorage.getItem(SETTINGS)).business_profile.preferredCurrency){
  return window.api.getCurrency(val,symbol);
}

function select_sale_type(){
  let invoice_items = JSON.parse(localStorage.getItem(CART));
  if(invoice_items.length <= 0){
    notification_msg("danger","Empty Invoice", "No item has been added to the invoice");
    return;
  }
  cash_or_credit_modal.show();
}

function sale_checkout(){
  // let invoice_notification = document.getElementById("invoice-notification");
  var sale_type = document.querySelector( 'input[name="cash-or-credit"]:checked');
  let cash_sale = sale_type.value === "cash" ? true : false;
  cash_or_credit_modal.hide();
  prepare_invoice_for_print(cash_sale);
}

function prepare_invoice_for_print(cash_sale){
  let cust_id_value = document.getElementById("cust-id-value");
  let invoice_items = JSON.parse(localStorage.getItem(CART));
  if(invoice_items.length <= 0){
    notification_msg("danger","Empty Invoice", "No item has been added to the invoice");
    return;
  }
  let inv_items_div = document.getElementById("inv-items-list");
  inv_items_div.innerHTML = "";
  let sub_total = 0;
  for(var i=0; i<invoice_items.length; i++){
    sub_total = window.api.addCurrencies(sub_total,invoice_items[i].sub_total);
    inv_items_div.innerHTML += "<tr>"+
                                  "<td class='inv-center-col'>"+(i+1).toString()+"</td>"+
                                  "<td>"+invoice_items[i].item+"</td>"+
                                  "<td class='inv-center-col'>"+invoice_items[i].qty+"</td>"+
                                  "<td class='inv-right-col'>"+window.api.currency(invoice_items[i].selling_unit_price)+"</td>"+
                                  "<td class='inv-right-col'>"+window.api.currency(invoice_items[i].sub_total)+"</td>"+
                              "</tr>";
  }
  let inv_business_name = document.getElementById("inv-business-name");
  let inv_business_address = document.getElementById("inv-business-address");
  let inv_business_contact = document.getElementById("inv-business-contact");
  let saved_settings = JSON.parse(localStorage.getItem(SETTINGS));
  inv_business_name.innerText = saved_settings.business_profile.businessName;
  inv_business_address.innerText = saved_settings.business_profile.businessAddress;
  inv_business_contact.innerText = saved_settings.business_profile.businessContact;

  let disc_amount = window.api.currencyValue(discount_field.value.trim());
  let gross_total = window.api.subtractCurrencies(sub_total, disc_amount);
  let invoice_subtotal_amt = document.getElementById("inv-subtotal");
  let invoice_disc_amt = document.getElementById("inv-discount");
  let invoice_total_amt = document.getElementById("inv-grandtotal");

  invoice_subtotal_amt.innerText = window.api.currency(sub_total);
  invoice_disc_amt.innerText = window.api.currency(disc_amount);
  invoice_total_amt.innerText = window.api.currency(gross_total);

  let cust_name_field = document.getElementById("search-customer-field");
  let cust_address_field = document.getElementById("customer-address");
  let inv_cust_name = document.getElementById("inv_customer_name");
  let inv_cust_addr = document.getElementById("inv_customer_address");
  inv_cust_name.innerText = cust_name_field.value.toUpperCase();
  inv_cust_addr.innerText = cust_address_field.value.toUpperCase();

  let inv_note = document.getElementById("inv-note");
  let terms_conditions = document.getElementById("terms-conditions");
  terms_conditions.innerText = inv_note.value.trim();

  // Add sales and invoice to database tables
  var new_invoice = {
    customer_id:parseInt(cust_id_value.value) > 0 ? parseInt(cust_id_value.value): 0,
    cash:cash_sale,
    num_of_items:invoice_items.length,
    sub_total:sub_total,
    discount:disc_amount,
    grand_total:gross_total,
    date:new Date()
  }
  let recorded_invoice_id = window.api.sendSyncSignal('save_invoice', new_invoice);
  let all_cart_item_sales_recorded = window.api.sendSyncSignal('save_sales', {invoice_id:recorded_invoice_id,cart_items:invoice_items});
  

  // let sales_response = window.api.sendSyncSignal('save_sales',{invoice_id:saved_invoice_id,cart_items:invoice_items});
  // console.log("Saved:",saved_invoice_id, "Saved sales?:",sales_response);

  let invoice_modal = new bootstrap.Modal(document.getElementById("invoiceModal"));
  invoice_modal.show();
}

function print_invoice_from_modal(){
  window.api.printInvoice("invoice-content",()=>{
    reload_window();
    clear_cart();
    load_all_customers();
    load_all_items();
  });
}

function close_print_invoice_modal(){
  reload_window();
  clear_cart();
  load_all_customers();
  load_all_items();
}

// SETTINGS Functions
function save_business_profile(){
  let new_profile = {
    businessName:business_name.value.trim(),
    businessAddress:business_address.value.trim(),
    businessContact:business_contact.value.trim()
  }
  window.api.sendUpdate("set_business_profile", new_profile);
  
  notification_msg("success", "Business Details", "Business details edited");
}

function save_new_currency(){
  let new_currency = business_currency.value.trim();
  window.api.sendUpdate("set_business_currency", new_currency);

  notification_msg("success", "Currency Changed", "Currency changed to "+new_currency);
}

function load_saved_settings(){
  // Load saved settings
  if(!(localStorage.hasOwnProperty(SETTINGS))){
    localStorage.setItem(SETTINGS,JSON.stringify(""));
  }

  let settings = window.api.sendSynchronousIPC("get_saved_settings");
  localStorage.setItem(SETTINGS, JSON.stringify(settings));

  // Update Settings' forms
  let saved_settings = JSON.parse(localStorage.getItem(SETTINGS));
  toggle_login_on_startup.checked = saved_settings.login_on_startup;
  business_name.value = saved_settings.business_profile.businessName;
  business_address.value = saved_settings.business_profile.businessAddress;
  business_contact.value = saved_settings.business_profile.businessContact;
  business_currency.value = saved_settings.business_profile.preferredCurrency;

  // Load Dashboard
  load_dashboard_page();

  // Load Sales
  load_sales_page();

  // Apply Settings
  for(var i=0; i<currency_symbols.length; i++){
    currency_symbols[i].innerText = saved_settings.business_profile.preferredCurrency;
  }
}

function notification_msg(alert_class, alert_type, alert_msg){
  let top_notification = document.getElementById("top-notification");
  let alert = "<div class='alert alert-"+alert_class+"'><span class='alert-type-"+alert_class+"'>"+alert_type+
              "</span> <span class='alert-msg'>"+alert_msg+"</span></div>";
  top_notification.innerHTML = alert;
  setTimeout(()=>{
    top_notification.innerHTML = "";
  },5000);
}

function load_local_storage_items(res){
  localStorage.setItem(res.table,JSON.stringify(res.data));
}

function reload_window(){
  window.api.sendSynchronousIPC("reload_window");
}

function save_opened_tab(){
  localStorage.setItem('opened_tab',this.id);
}


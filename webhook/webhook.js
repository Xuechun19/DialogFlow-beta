const express = require('express')
const { WebhookClient } = require('dialogflow-fulfillment')
const app = express()
const fetch = require('node-fetch')
const base64 = require('base-64')
const { InputGroup } = require('react-bootstrap')

let username = "";
let password = "";
let token = "";

USE_LOCAL_ENDPOINT = false;
// set this flag to true if you want to use a local endpoint
// set this flag to false if you want to use the online endpoint
ENDPOINT_URL = ""
if (USE_LOCAL_ENDPOINT){
ENDPOINT_URL = "http://127.0.0.1:5000"
} else{
ENDPOINT_URL = "https://mysqlcs639.cs.wisc.edu"
}



async function getToken () {
  let request = {
    method: 'GET',
    headers: {'Content-Type': 'application/json',
              'Authorization': 'Basic '+ base64.encode(username + ':' + password)},
    redirect: 'follow'
  }

  const serverReturn = await fetch(ENDPOINT_URL + '/login',request)
  const serverResponse = await serverReturn.json()
  token = serverResponse.token

  return token;
}

async function agentMes(message) {
  let news = {}
  news.isUser = false;
  news.text = message;
  let request = {
    method: 'POST',
    headers: {'Content-Type': 'application/json',
              'x-access-token': token},
    body: JSON.stringify(news),
    redirect: 'follow'
  }
 
  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/messages',request)
  const serverResponse = await serverReturn.json()
  

  return serverResponse;
}

async function userMes(message) {
  let news = {}
  news.isUser = true;
  news.text = message;
  let request = {
    method: 'POST',
    headers: {'Content-Type': 'application/json',
              'x-access-token': token},
    body: JSON.stringify(news),
    redirect: 'follow'
  }

  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/messages',request)
  const serverResponse = await serverReturn.json()
  

  return serverResponse;
}
async function deleteMes() {
  let request = {
    method: 'DELETE',
    headers: {'Content-Type': 'application/json',
              'x-access-token': token},
    redirect: 'follow'
  }

  const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/messages',request)
  const serverResponse = await serverReturn.json()
  

  return serverResponse;
}



app.get('/', (req, res) => res.send('online'))
app.post('/', express.json(), (req, res) => {
  const agent = new WebhookClient({ request: req, response: res })

  function welcome () {
    agent.add('Webhook works!')
    console.log(ENDPOINT_URL)
  }

  async function login () {

    // You need to set this from `username` entity that you declare in DialogFlow
    username = agent.parameters.username
    // You need to set this from password entity that you declare in DialogFlow
    password = agent.parameters.password
    await getToken()
    await deleteMes();
    await userMes(agent.query);
    // agent.add(token)

    agentString = "You are attempting to login with username "+ username + " and password "+ password + ". Login Successfully. Congrats!";
    if (token !== "" && token !== 'undefined') { 
      await agentMes(agentString); 
      agent.add(agentString); 
      
    }else{
      agent.add("Login failed.")
      await agentMes("Login failed.")
    }  
  }
  

  async function category () {
    await userMes(agent.query);
    let request = {
      method: 'GET'
    }
    const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/categories', request)
    const data = await serverReturn.json();

    let categories = data["categories"];
    let catString = "";
    let endString = "";
    for(let i=0; i<categories.length-1; i++){
       catString = catString + categories[i] + ", ";
    }
   
    endString = "and " + categories[categories.length-1] + ".";
    
    agent.add("We have categories "+ catString + endString)
    return await agentMes("We have categories "+ catString + endString)
    

  }

  async function tag (){

    let category = agent.parameters.category;
    await userMes(agent.query);
    let request = {
      method: 'GET'
    }
    const serverReturn = await fetch("https://mysqlcs639.cs.wisc.edu/categories" + "/" + category + "/tags", request)
    const data = await serverReturn.json();

    agent.add(category)

    let tags = data["tags"];
    let catString = "";
    let endString = "";

    if(tags.length === 1){
      agent.add("Tags for "+category+"is "+ tags[0])

    }else{
      for(let i=0; i<tags.length-1; i++){
        catString = catString + tags[i] + ", ";
      }
    
     endString = "and " + tags[tags.length-1] + ".";
     
     
     agent.add("We have tags for "+category +" is "+ catString + endString)
     return await agentMes("We have tags for "+category +" is "+ catString + endString)
    }
  }
 
    
    async function cart (){
   
    let choice = agent.parameters.choice;
    let result = "";
    await userMes(agent.query);
    let request = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-access-token': token,
      },
    } 

    const serverReturn = await fetch("https://mysqlcs639.cs.wisc.edu/application/products", request)
    const data = await serverReturn.json();
    // token = data.token;
  
    let product = data["products"];
    
    let price = 0;
    
    ////////total number of products
    if(choice === "number"){
      result = "We have ";
      let counter = 0;
      for(let i = 0; i < product.length; i++) {
        counter += product[i].count;
      }
      result += counter +"  items in your cart."
      // agent.add(result);
      // await agentMes(result);

    }

    ////////type of items
    else if(choice === "types"){
      result = "We have ";
      for(let i = 0; i < product.length - 1; i++) {
        result += product[i].category + ", "
      }
      result += product[product.length - 1].category + " in your cart";
      // agent.add(result);
      // await agentMes(result);
    }

    ///////total price
    
    else if(choice === "price"){
      result = "The total price is ";

      for(let i = 0; i < product.length; i++) {
        price += product[i].price;
      }
      result += "$" + price + " dollars. Thank you.";
      // agent.add(result)
      // await agentMes(result);
      

    }

    ///items
    else if(choice === "name"){

      result = "These items are ";
      
      for(let i = 0; i < product.length-1; i++) {
        result += product[i].name + ", ";
      }
      result += product[product.length-1].name + ". Thank you.";
      // agent.add(result)
      // await agentMes(result);
      // output = await agentMes(result)
    }
    
      agent.add(result);
      return await agentMes(result);
    
  }




  async function product (){
    let proName = agent.parameters.proName;

    await userMes(agent.query);

    let request = {
      method: 'GET',
      
    } 

    const serverReturn = await fetch("https://mysqlcs639.cs.wisc.edu/products", request)
    const data = await serverReturn.json();
    

    let proList = [];
    let chosePro;
    let foundPro;

    proList = data.products;

    for(chosePro of proList){
    
      if(proName === chosePro.name){
        foundPro = chosePro;
        proString = "The product "+chosePro.name+"'s price is "+chosePro.price+" and its description is "+chosePro.description+".";
        agent.add(proString)
        await agentMes(proString)

        /////direct user to this product page
        await fetch('https://mysqlcs639.cs.wisc.edu/application', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({"page": "/" + username + "/"+chosePro.category+ "/products/" + chosePro.id}),
      })
      agent.add("You are currently at the product: "+chosePro.name+" page.")
      await agentMes("You are currently at the product: "+chosePro.name+" page.")
        
        ////get this product's information
        let request = {
          method: 'GET',
          
        } 
    
        const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu//products/' + foundPro.id + '/reviews', request)
        const data = await serverReturn.json();

        let reviewList = data.reviews;
        let reviewLength = data.reviews.length;
        let allScore = 0.0;

        let curView;

        for(curView of reviewList){
          allScore += curView.stars;
        }

        let avgScore = allScore/reviewLength;



        let reviewString = "There are "+reviewLength+" pieces of reviews and the average rating for this item is "+ avgScore+".";

        agent.add(reviewString)
        await agentMes(reviewString)

      }
      // else{
      //   agent.add("Sorry we didn't find this item.")
        
      // }
      if(foundPro === ""){
        agent.add("Sorry we didn't find this item.")
        await agentMes("Sorry we didn't find this item.")
      }


      // else{
      //   agent.add("Sorry we didn't find this item.")
      // }

    }


  }

  async function addNarrowTag (){
    let tag = agent.parameters.tag;
    let selectTag;
    let choseTag;
    await userMes(agent.query);
    let request = {
      method: 'GET',
    }
    
    const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/tags',request)
    const data = await serverReturn.json()

    let tagList = data.tags;
    
    for(selectTag of tagList){
      if(tag === selectTag){
        choseTag = selectTag;
        /////add tag to the search
        let request = {
          method: 'POST',
          headers: {'Content-Type': 'application/json',
                    'x-access-token': token},
          redirect: 'follow'
        }
      
        const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/tags/' + choseTag,request)
        const dataTag = await serverReturn.json()


        agent.add("Tag: "+choseTag+" is added to your search.")
        await agentMes("Tag: "+choseTag+" is added to your search.")

        //////get the products after adding tags(piazza said this is the query func should do)

      }

    }
    if(choseTag === ""){
      agent.add("Sorry we didn't find this tag.")
      await agentMes("Sorry we didn't find this tag.")
    }

  }

  
  async function deleteNarrowTag (){
    let deleteTag = agent.parameters.tag;
    await userMes(agent.query);
    let request = {
      method: 'GET',
      headers: {'Content-Type': 'application/json',
                'x-access-token': token},
      redirect: 'follow'
    }
  
    const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/tags',request)
    const data = await serverReturn.json()

    let tagList = data.tags;
    let selectTag;
    let choseTag;

    for(selectTag of tagList){
      if(deleteTag === selectTag){
        choseTag = selectTag;
        /////remove tag
        let request = {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json',
                    'x-access-token': token},
          redirect: 'follow'
        }
      
        const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/tags/' + choseTag,request)
        const data = await serverReturn.json()

        agent.add("Tag: " + choseTag + " has been removed.")
        await agentMes("Tag: " + choseTag + " has been removed.")
      }
    }

    if(choseTag === ""){
      agent.add("Sorry we didn't find this tag.")
      await agentMes("Sorry we didn't find this tag.")
    }
  }




  async function addToCart (){
    let item = agent.parameters.item;
    let number = agent.parameters.number;
    let curPro;
    let chosePro;

    let proList = [];

    ////get the product list from api
    await userMes(agent.query);
    let request = {
      method: 'GET',
    }
  
    const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/products',request)
    const data = await serverReturn.json()

    proList = data.products;

    

    for(curPro of proList){
      if(item === curPro.name){
        chosePro = curPro;
      }
    }

    
    // else{
     

       if(chosePro !== ""){
        //user didn't specify the number or specify only one item
        if(number === "" || number === 1 || typeof number === 'undefined'){
            ////add one item to the cart
            let request = {
              method: 'POST',
              headers: {'Content-Type': 'application/json',
                        'x-access-token': token},
              redirect: 'follow'
            }
          
            const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/products/' + chosePro.id,request)
            const data = await serverReturn.json()

            agent.add("One item: "+chosePro.name+" has been added to your cart.")
            await agentMes("One item: "+chosePro.name+" has been added to your cart.")
        }else{
          ////user want to add more than one items into cart
          for (let i = 0; i < number; i++){
            let request = {
              method: 'POST',
              headers: {'Content-Type': 'application/json',
                        'x-access-token': token},
              redirect: 'follow'
            }
          
            const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/products/' + chosePro.id,request)
            const data = await serverReturn.json()
            
            // agent.add(number + " "+ chosePro.name+" has been added to your cart.")
            
          }
          agent.add(agent.parameters.number+":"+chosePro.name+" has been added to your cart.")
          await agentMes(agent.parameters.number+":"+chosePro.name+" has been added to your cart.")
        }
      }
        else{
          agent.add("Sorry, we cannot find this product.")
          await agentMes("Sorry, we cannot find this product.")

        }

      // }
      // }
      
      // else{
      //    for(let i=0; i<proList.length; i++){
      //     agent.add("Sorry, we cannot find this product.")
      //     break
      //    }      
      // }

    }
    // if(item === "" || item === 'undefined'){
    //   agent.add("Sorry, we cannot find this product.")
    // }
    
  

  async function removeFromCart (){
    await userMes(agent.query);
    let item = agent.parameters.item;
    let number = agent.parameters.number;
    let curPro;
    let chosePro;
    

    let proList = [];
    let cartContent;
    let numItems;
    let select;
   

    let request = {
      method: 'GET',
    }
  
    const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/products',request)
    const data = await serverReturn.json()

    proList = data.products;

    for(curPro of proList){
      if(item === curPro.name){
        chosePro = curPro;
      }
    }

    if(chosePro === ""){
      agent.add("Sorry we didn't find this product.")
      await agentMes("Sorry we didn't find this product.")
    }else{
      

      /////get all items in the cart
      let request = {
        method: 'GET',
        headers: {'Content-Type': 'application/json',
                  'x-access-token': token},
        redirect: 'follow'
      }
    
      const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/products', request)
      const data1 = await serverReturn.json()

      cartContent = data1.products


      for(select of cartContent){
        
        if(select.name === item.name){
          numItems = numItems + select.count;
        }
      }
    }

    if(numItems === 0){
      agent.add("Sorry, there are "+numItems+" in your cart and we cannot remove.")
      await agentMes("Sorry, there are "+numItems+" in your cart and we cannot remove.")

    }

    if(number === "" || number === 1 || typeof number === 'undefined'){
      //////remove one item from cart
      let request = {
        method: 'DELETE',
        headers: {'Content-Type': 'application/json',
                  'x-access-token': token},
        redirect: 'follow'
      }
    
      const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/products/' + chosePro.id,request)
      const data = await serverReturn.json()

      agent.add("One item: "+chosePro.name+" has been removed from your cart.")
      await agentMes("One item: "+chosePro.name+" has been removed from your cart.")
    }else{
      
      if(number > numItems){
        agent.add("Your requested number exceeds the current items in cart.")
        await agentMes("Your requested number exceeds the current items in cart.")
      }else{
        ////remove several items from cart
        for (let i = 0; i < number; i++) {
          //
          let request = {
            method: 'DELETE',
            headers: {'Content-Type': 'application/json',
                      'x-access-token': token},
            redirect: 'follow'
          }
        
          const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/products/' + chosePro.id,request)
          const data = await serverReturn.json()
        }
        
        agent.add(number+":"+chosePro.name+" has been removed from your cart.")
        await agentMes(number+":"+chosePro.name+" has been removed from your cart.")
      }
    }
  }
  
  async function clearCart (){
    await userMes(agent.query);
    let request = {
      method: 'DELETE',
      headers: {'Content-Type': 'application/json',
                'x-access-token': token},
      
    }
  
    const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/products/', request)
    const data = await serverReturn.json()

    agent.add("Your cart has been cleared.");
    await agentMes("Your cart has been cleared.")

  }
  async function reviewCart (){
    await userMes(agent.query);
    let request = {
      method: 'GET',
      headers: {'Content-Type': 'application/json',
                'x-access-token': token},
      redirect: 'follow'
    }
  
    const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application/products', request)
    const data = await serverReturn.json()

    let cartItems;

    cartItems = data.products;
    if(cartItems.length === 0){
      let parse = {}
      parse.page = "/" + username + "/cart-review", false;
      let request = {
        method: 'PUT',
        headers: {'Content-Type': 'application/json',
                  'x-access-token': token},
        body: JSON.stringify(parse),
        redirect: 'follow'
      }
    
      const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application',request)
      const serverResponse = await serverReturn.json()

      agent.add("There is no items in your cart currently.")
      await agentMes("There is no items in your cart currently.")
    }else{
      let parse = {}
      parse.page = "/" + username + "/cart-review", false;
      let request = {
        method: 'PUT',
        headers: {'Content-Type': 'application/json',
                  'x-access-token': token},
        body: JSON.stringify(parse),
        redirect: 'follow'
      }
    
      const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application',request)
      const serverResponse = await serverReturn.json()

      agent.add("You can review your cart now.")
      await agentMes("You can review your cart now.")
    }

  }
  
  async function confirmCart (){
    await userMes(agent.query);
    let parse = {}
    parse.page = "/" + username + "/cart-confirmed"

    let request = {
      method: 'PUT',
      headers: {'Content-Type': 'application/json',
                'x-access-token': token},
      body: JSON.stringify(parse),
      redirect: 'follow'
    }
  
    const serverReturn = await fetch('https://mysqlcs639.cs.wisc.edu/application',request)
    const serverResponse = await serverReturn.json()

    agent.add("You can confirm/checkout your cart now.")
    await agentMes("You confirmed your cart.");

  }



  async function categoryNavigation (){
    await userMes(agent.query);
    

    let cate = agent.parameters.cate;
    console.log(cate)

    
      /////direct user to this category page
      await fetch('https://mysqlcs639.cs.wisc.edu/application', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({page: "/" + username + "/" + cate}),
      })
      agent.add("You are currently at the category: "+cate+" page.")
      await agentMes("You are currently at the category: "+cate+" page.")
    


  }
  ////product navigation is in the product() function


  async function navigation (){
    let nav = agent.parameters.navigation;
    await userMes(agent.query);
    if(nav === "home page"){
      nav = "";

      await fetch('https://mysqlcs639.cs.wisc.edu/application', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token,
        },
        body: JSON.stringify({page: "/" + username}),
      })

      agent.add("You are now at the home page.")
      await agentMes("You are now at the home page.")

    }
  }



  let intentMap = new Map()
  intentMap.set('Default Welcome Intent', welcome)
  // You will need to declare this `Login` content in DialogFlow to make this work
  intentMap.set('Login', login) 
  intentMap.set('Category', category)
  intentMap.set('Tag', tag)
  intentMap.set('Cart', cart)
  intentMap.set('Product', product)
  intentMap.set('Add-narrow-tag', addNarrowTag)
  intentMap.set('Delete-narrow-tag', deleteNarrowTag)
  intentMap.set('Add-to-cart', addToCart)
  intentMap.set('Remove-from-cart', removeFromCart)
  intentMap.set('Clear-cart', clearCart)
  intentMap.set('Review-cart', reviewCart)
  intentMap.set('Confirm-cart', confirmCart)
  intentMap.set('Category-navigation', categoryNavigation)
  intentMap.set('Navigation', navigation)

  agent.handleRequest(intentMap)
})

app.listen(process.env.PORT || 8080)

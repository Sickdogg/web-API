// Create needed constants
//使用 indexedDB API 存處複雜的數據
//indexedDB結構 數據庫(db)>物件庫(os)>物件({key:value})
const list = document.querySelector('ul');
const titleInput = document.querySelector('#title');
const bodyInput = document.querySelector('#body');
const form = document.querySelector('form');
const submitBtn = document.querySelector('form button');

// Create an instance of a db object for us to store the open database in

//建立變量db
let db;

// Open our database; it is created if it doesn't already exist
// (see the upgradeneeded handler below)

// 請求一個 命名:notes_db數據庫的indexedDB物件
const openRequest = window.indexedDB.open('notes_db', 1);

// error handler signifies that the database didn't open successfully
//建立錯誤的監聽事件
openRequest.addEventListener('error', () => console.error('Database failed to open'));

// success handler signifies that the database opened successfully
//建立成功的監聽事件
openRequest.addEventListener('success', () => {
  console.log('Database opened succesfully');

  // Store the opened database object in the db variable. This is used a lot below
  //如果成功得到結果的物件
  db = openRequest.result;

  // Run the displayData() function to display the notes already in the IDB
  displayData();
});

// Set up the database tables if this has not already been done
//監聽:upgradeneeded 在沒有數據庫跟版本不同時觸發，創建或更新
openRequest.addEventListener('upgradeneeded', e => {

  // Grab a reference to the opened database
  db = e.target.result;

  // Create an objectStore to store our notes in (basically like a single table)
  // including a auto-incrementing key
  //在數據庫notes_db版本1中建立物件庫notes_os，設定共有id欄位自動增加
  const objectStore = db.createObjectStore('notes_os', { keyPath: 'id', autoIncrement:true });

  // Define what data items the objectStore will contain
  //對物件庫notes_os新增2個物件各有2個欄位索引
  objectStore.createIndex('title', 'title', { unique: false });
  objectStore.createIndex('body', 'body', { unique: false });

  console.log('Database setup complete');
});

// Create an submit handler so that when the form is submitted the addData() function is run
form.addEventListener('submit', addData);

// Define the addData() function
function addData(e) {
  // prevent default - we don't want the form to submit in the conventional way
  e.preventDefault();

  // grab the values entered into the form fields and store them in an object ready for being inserted into the DB
  const newItem = { title: titleInput.value, body: bodyInput.value };

  // open a read/write db transaction, ready for adding the data
  //寫入資料的步驟--->transaction添加事務--->objectStore進入物件庫

  //使用 transaction(交易的資料表,交易方式)方法添加事務
  const transaction = db.transaction(['notes_os'], 'readwrite');

  // call an object store that's already been added to the database
  //進入物件庫
  const objectStore = transaction.objectStore('notes_os');

  // Make a request to add our newItem object to the object store
  //對物件庫新增資料
  const addRequest = objectStore.add(newItem);

  //監聽:新增成功後清除輸入框
  addRequest.addEventListener('success', () => {
    // Clear the form, ready for adding the next entry
    titleInput.value = '';
    bodyInput.value = '';
  });

  // Report on the success of the transaction completing, when everything is done
  //監聽:完成後彈出完成訊息，並顯示資料在表單上
  transaction.addEventListener('complete', () => {
    console.log('Transaction completed: database modification finished.');

    // update the display of data to show the newly added item, by running displayData() again.
    displayData();
  });

  transaction.addEventListener('error', () => console.log('Transaction not opened due to error'));
}

// Define the displayData() function
function displayData() {
  // Here we empty the contents of the list element each time the display is updated
  // If you ddn't do this, you'd get duplicates listed each time a new note is added

  //起手式刪除所有資料
  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  // Open our object store and then get a cursor - which iterates through all the
  // different data items in the store

  //添加事務並進入物件庫
  const objectStore = db.transaction('notes_os').objectStore('notes_os');

  //使用openCursor得到資料，等待回傳值
  objectStore.openCursor().addEventListener('success', e => {
    // Get a reference to the cursor
    // 得到回傳值 e.target.result
    const cursor = e.target.result;

    // If there is still another data item to iterate through, keep running this code
    if(cursor) {
      // Create a list item, h3, and p to put each data item inside when displaying it
      // structure the HTML fragment, and append it inside the list
      const listItem = document.createElement('li');
      const h3 = document.createElement('h3');
      const para = document.createElement('p');

      listItem.appendChild(h3);
      listItem.appendChild(para);
      list.appendChild(listItem);

      // Put the data from the cursor inside the h3 and para
      h3.textContent = cursor.value.title;
      para.textContent = cursor.value.body;

      // Store the ID of the data item inside an attribute on the listItem, so we know
      // which item it corresponds to. This will be useful later when we want to delete items
      listItem.setAttribute('data-note-id', cursor.value.id);

      // Create a button and place it inside each listItem
      const deleteBtn = document.createElement('button');
      listItem.appendChild(deleteBtn);
      deleteBtn.textContent = 'Delete';

      // Set an event handler so that when the button is clicked, the deleteItem()
      // function is run
      deleteBtn.addEventListener('click', deleteItem);

      // Iterate to the next item in the cursor
      cursor.continue();
    } else {
      // Again, if list item is empty, display a 'No notes stored' message
      if(!list.firstChild) {
        const listItem = document.createElement('li');
        listItem.textContent = 'No notes stored.'
        list.appendChild(listItem);
      }
      // if there are no more cursor items to iterate through, say so
      console.log('Notes all displayed');
    }
  });
}

// Define the deleteItem() function
function deleteItem(e) {
  // retrieve the name of the task we want to delete. We need
  // to convert it to a number before trying it use it with IDB; IDB key
  // values are type-sensitive.
  const noteId = Number(e.target.parentNode.getAttribute('data-note-id'));

  // open a database transaction and delete the task, finding it using the id we retrieved above
  const transaction = db.transaction(['notes_os'], 'readwrite');
  const objectStore = transaction.objectStore('notes_os');
  const deleteRequest = objectStore.delete(noteId);

  // report that the data item has been deleted
  transaction.addEventListener('complete', () => {
    // delete the parent of the button
    // which is the list item, so it is no longer displayed
    e.target.parentNode.parentNode.removeChild(e.target.parentNode);
    console.log(`Note ${noteId} deleted.`);

    // Again, if list item is empty, display a 'No notes stored' message
    if(!list.firstChild) {
      const listItem = document.createElement('li');
      listItem.textContent = 'No notes stored.';
      list.appendChild(listItem);
    }
  });
}

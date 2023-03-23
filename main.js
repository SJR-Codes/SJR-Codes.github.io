//const baseURL = "https://oyf.azuresites.net"; //F U owner of this shite

const baseURL = "https://oyf.azurewebsites.net";
let cont = document.getElementById('content');
let foot = document.getElementById("footer");
let userEmail = false;
let isAdmin = false; //relax, it's just for showing or not certain forms, your beh... backend is safe
let categories = false;
//TODO: we're getting lot of globals lately, is this the way?

function getInit() {
    let myInit = {
        method: "GET",
        headers: {
            Accept: "application/json",
            Authorization: "Bearer " + sessionStorage.getItem('token'),
        },
        mode: "cors",
        cache: "default",
    };
    return myInit;
}
async function goFetch(request){
    const response = await fetch(request);
    //console.debug("Res: " + response.json())
    if (response.status === 200) {
        return await response.json();
    }
    else {
        //TODO: catch errors -> location.reload(); to get back to login... implies that only error would be token timeout... in SUE cases that's appropriate punishment too
        cont.innerHTML += "<div class='error'>Error: Couldn't fetch data. Contact support.</div>";
        return false;
    }
}
async function getPhotos() {
    let myInit = getInit();
    const request = new Request(baseURL + "/photos/", myInit);
    let res = await goFetch(request);
    if ( res !== false ) {
        cont.innerHTML = "";
        res.forEach((photo) => {
            let click = 'onclick="getPhoto(\'' + photo.id + '\')"';
            let img = "<img src='data:image/jpeg;base64," + photo.thumbnail + "' alt='photo'></img>";
            let span = "<span " + click + " class='thumb'>" + img + "<span/>";
            cont.innerHTML += span;  
        });
    }
}
async function getPhoto(id) {
    const fpath = "/photos/" + id;
    let myInit = getInit();
    const request = new Request(baseURL + fpath, myInit);
    let res = await goFetch(request);
    //console.debug("Res: " + res)
    if ( res !== false ) {
        let click = 'onclick="getFullPhoto(\'' + id + '\')"';
        let img = "<img src='data:image/jpeg;base64," + res.image + "' alt='photo'></img>";
        let span = "<span " + click + " class='midpic'>" + img + "<span/><br>";
        //TODO: should learn how to async correctly...
        /* if ( res.category_id !== null ) {
            span += "<span class='info'>" + categories[res.category_id].title + "<span/>";
        } */
        cont.innerHTML = span;
    }
}
async function doLogin(e) {
    e.preventDefault();
    console.debug("Trying login...")
    const usern = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    if( usern == "" || password == "" ) {
        cont.innerHTML = "<div class='error'>Enter username and password, please.</div>" + cont.innerHTML;
        return null;
    }
    
    //hide form after getting both values
    document.getElementById('login-form').classList.add("hidden");
    //TODO: some nice rolling hourglass would be nice
    cont.innerHTML = "<h3>One moment, please. Loggin you in...</h3>" + cont.innerHTML;

    const queryParams = { username: usern, password: password }
    const formbody = new URLSearchParams(queryParams).toString();    
    const request = new Request(baseURL + "/auth/jwt/login", {
        method: "POST",
        mode: "cors", // no-cors, *cors, same-origin
        headers: {
            "Accept": "application/json",
            "Content-Type": 'application/x-www-form-urlencoded',
        },
        body: formbody,
    });
    let res = await goFetch(request);
    
    if ( res !== false ) {
        sessionStorage.setItem('token', res.access_token);
        await setUserInfo();
        await getCategories();
        await showNavi();
        await getPhotos();
    }
}
async function AddCategory(e) {
    e.preventDefault();
    let cat_title = document.getElementById('title').value;
    if( cat_title == "" ) {
        cont.innerHTML += "<div class='error'>Error! Enter title for new category.</div>";
        return null;
    }    
    let data = JSON.stringify({"title": cat_title});
    const request = new Request(baseURL + "/categories/", {
        method: "POST",
        mode: "cors", // no-cors, *cors, same-origin
        headers: {
            'Accept': 'application/json',
            'Authorization': "Bearer " + sessionStorage.getItem('token'),
            'Content-Type': 'application/json',
        },
        body: data,
    });
    let res = await goFetch(request);
    if ( res !== false ) {
        await getCategories();
        await showSettings();
        cont.innerHTML += '<div class="success">New category added very sucessfully!</div>';
    }
}

async function showSettings() {
    cont.innerHTML = "";
    await showUserInfo();
    await showDivider();
    if ( isAdmin == true ) {
        await showCategories();
    }
}

async function showDivider() {
    cont.innerHTML += "<div class='divider'></div>";
}
//TODO: daamn, tis' ugly as fudge
async function showNavi() {
    let navi = `<p id="footnavi"><span class="fakelink" onclick="getPhotos()">Photos</span> | `;
    if ( isAdmin == true ) { navi += `<span class="fakelink" onclick="showUpload()">Upload</span> | `; }
    navi += `<span class="fakelink" onclick="showSettings()">Settings</span></p>`;

    foot.innerHTML = navi;
}
async function setUserInfo() {
    const token = sessionStorage.getItem('token');    
    let myInit = getInit();
    const request = new Request(baseURL + "/users/me", myInit);
    let res = await goFetch(request);
    if ( res !== false ) {
        //cont.innerHTML = JSON.stringify(res);
        userEmail = res.email;
        isAdmin = res.is_superuser;
    }
}
async function showUserInfo(clear = false) {
    if ( userEmail !== false ) {
        //cont.innerHTML = JSON.stringify(res);
        let uinfo = 
            `<h3>Your email:</h3>
            <form action="" id="user-form">
            <input type="text" name="email" id="email" class="text-input" value="${userEmail}"><br><br>
            <!--<button class="button" onclick="UpdateUser(event)">Change</button>--></form>`;
        clear == true ? cont.innerHTML = uinfo : cont.innerHTML += uinfo;
    };
}
async function getCategories() {
    let myInit = getInit();
    const request = new Request(baseURL + "/categories/", myInit);
    let res = await goFetch(request);
    if ( res !== false ) {
        categories = res;
    }
}
async function showCategories(clear = false) {
    let block = ""
    if ( categories !== false ) {
        block = "<h3>Photo categories:</h3>";
        categories.forEach((category) => {
            //let click = 'onclick="getPhotos(\'' + category.id + '\')"';
            //let img = "<img src='data:image/jpeg;base64," + photo.thumbnail + "' alt='photo'></img>";
            //let span = "<span " + click + " class='list'>" + category.title + "<span/>";
            let span = "<span class='list'>" + category.title + "<span/><br>";
            block += span;  
        });
    }

    let form = `<form action="" id="cat-form">
    <input type="text" name="title" id="title" class="text-input" placeholder="New category"><br><br>
    <button class="button" onclick="AddCategory(event)">Add</button></form>`;
    block += form;
    clear == true ? cont.innerHTML = block : cont.innerHTML += block;
}
function showUpload() {
    let form = `<h3>Upload new photo:</h3><form action="" id="up-form">
    <input type="file" name="upfile" id="upfile" class="text-input" placeholder=""><br><br>`;

    if ( categories !== false ) {
        list = "<select class='text-input' id='category_id' name='category_id'>";
        list += "<option value=''> - select category - </option>";
        categories.forEach((category) => {
            list += "<option value='" + category.id + "'>" + category.title + "</option>";
        });
        list += "</select>"
    }

    form += list + `<br><br><button class="button" onclick="doUpload(event)">Send</button></form>`;

    cont.innerHTML = form;
}
async function doUpload(e) {
    e.preventDefault();
    const upfile = document.getElementById("upfile");
    const category_id = document.getElementById("category_id").value;
    if( upfile.files.length == 0 ){
       cont.innerHTML += '<div class="error">Select file to upload, pretty please!</div>';
       return false;
    }
    if( category_id == '' ){
       cont.innerHTML += '<div class="error">Select category for photo, pretty please!</div>';
       return false;
    }
    form = new FormData(document.getElementById('up-form'));

    //TODO: error checking needed here...
    let res = await upStuff("/upload/", form);
    console.debug(res);
    await getPhoto(res.id);
    cont.innerHTML += '<div class="success">Photo uploaded very sucessfully!</div>';
}
async function upStuff(fpath, body){
    let request = new Request(baseURL + fpath, {
        method: "POST",
        mode: "cors", // no-cors, *cors, same-origin
        headers: {
            'Accept': 'application/json',
            //'Content-Type': 'multipart/form-data', //i'll remember you, you puny piece of sales
            'Authorization': "Bearer " + sessionStorage.getItem('token'),
        },
        body: body, 
    });
    let res = await goFetch(request);
    if ( res !== false ) {
        return res;
    }
}
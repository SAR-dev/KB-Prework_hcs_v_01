// declaring the size

var canvas = document.createElement("canvas");
canvas.width = 415;
canvas.height = 415;
var context = canvas.getContext('2d');
var image = document.getElementById('image');

var url = '/upload/'

// only requirement is video now
var constraints = {
    audio: false,
    video: {
        width: 415,
        height: 415
    }
}

// access to the camera
if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        video.srcObject = stream;

        window.setInterval(function() {
            //context.drawImage(video, 0, 0);
            context.drawImage(video, 0, 0, 415, 415);
            
  
            canvas.toBlob(upload, "image/jpeg");
        }, 150);    
    });
}


//POST realtime data

function upload(file) {
    // create formdata 
    var formdata =  new FormData();
    
    // adding file to formdata
    formdata.append("h-img", file);
    
    // create AJAX connection
    var xhr = new XMLHttpRequest();
    
    //initializes the request  
    xhr.open("POST", this.url, true);

    xhr.responseType = 'text';   
    // define function which get response
    xhr.onload = function() {
        
        if(this.status = 200) {
            //console.log(this.response);
        } else {
            console.error(xhr);
        }

        image.src = 'data:image/jpeg;base64,'+this.response; // base64
    };
    
    // send formdata in AJAX
    xhr.send(formdata);
}


//add color div in html

function addHairColors () {
    var colors = ["#ba7740", "#4ab056", "#d4253a", "#932558", "#6B9CA8", "#5D3984", "#F8C649", "#185ADB", "#898BB5", "#dd4bc9", "#FF6600"];
    var colorsHtml = ""
    for (var i = 0; i < colors.length; i++) {
        colorsHtml = colorsHtml + 

        `<button id="cb${i}" onclick="colorFunction(this.value)" value ="${colors[i]}"
           class="focus:outline-none rounded-md border p-2 ring-2 ring-transparent hover:border-blue-200 flex w-20 justify-center"
              style="border-color: rgb(229, 231, 235);">
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
                    version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 152.93 152.93"
                     xml:space="preserve" class="h-10 w-10" style="fill: ${colors[i]};">
                     <g>
                       <path d="M121.062,15.788c0,0-38.044-36.074-83.016,5.437c0,0-24.206,19.768-19.263,78.567c0,0-3.459,29.652-18.784,31.146    c0,0,16.307,0.493,22.241-9.4c0,0,0.493,19.76-19.77,24.712c0,0,20.263-1.483,27.187-12.849c0,0,1.978,11.365-12.847,15.316    c0,0,29.155,0.99,41.511-12.355c0,0-16.307-22.742-10.874-35.093c0,0,13.841-34.093,35.586-38.542c0,0-8.404,12.846-15.81,16.801    c0,0,36.076-5.428,52.886-17.78c0,0,2.955-0.499,2.955,5.433c0,0,2.464,19.271,8.897,27.182c0,0,1.49,46.446-29.653,57.313    c0,0,45.959-2.955,50.408-56.832C152.695,94.85,157.64,17.766,121.062,15.788z">
                       </path>
                    </g>
                </svg>
    </button>`
    }
    $('#hair-colors').html(colorsHtml)
}
window.onload = addHairColors;

function colorFunction (val) {
    this.url = '/upload/'+val.slice(1)
    console.log(this.url)
}

//download image

function captureImage() {
    var link = document.createElement("a");

    document.body.appendChild(link);

    link.setAttribute("href", image.src);
    link.setAttribute("download", 'image');
    link.click();
}


// before and after image slider

function initComparisons() {
  var x, i;
  //find all elements of "overlay"
  x = document.getElementsByClassName("img-comp-overlay");
  for (i = 0; i < x.length; i++) {
    //for each "overlay" element:
    //pass the "overlay" element to compareImages
    compareImages(x[i]);
  }
  function compareImages(img) {
    var slider, img, clicked = 0, w, h;
    //width and height of the img
    w = img.offsetWidth;
    h = img.offsetHeight;
    //set the width of the img element to 0%
    img.style.width = 0 + "px";
    //create slider
    slider = document.createElement("DIV");
    slider.setAttribute("class", "img-comp-slider");
    //insert slider
    img.parentElement.insertBefore(slider, img);
    //position the slider in the mid-left
    slider.style.top = (h / 2) - (slider.offsetHeight / 2) + "px";
    slider.style.left = 0 + "px";
    //execute a function when the mouse button is pressed
    slider.addEventListener("mousedown", slideReady);
    //another function when the mouse button is released
    window.addEventListener("mouseup", slideFinish);
    // if touches (for touch screens)
    slider.addEventListener("touchstart", slideReady);
    // released (for touch screens)
    window.addEventListener("touchend", slideFinish);
    function slideReady(e) {
      //prevent any other actions when moving over the image
      e.preventDefault();
      //the slider is now clicked and ready to move
      clicked = 1;
      //execute when the slider is moved
      window.addEventListener("mousemove", slideMove);
      window.addEventListener("touchmove", slideMove);
    }
    function slideFinish() {
      //slider is no longer clicked
      clicked = 0;
    }
    function slideMove(e) {
      var pos;
      //if the slider is no longer clicked, exit this function
      if (clicked == 0) return false;
      //get the cursor's x position
      pos = getCursorPos(e)
      //prevent the slider from being positioned outside the image
      if (pos < 0) pos = 0;
      if (pos > w) pos = w;
      //execute a function that will resize the overlay image according to the cursor
      slide(pos);
    }
    function getCursorPos(e) {
      var a, x = 0;
      e = (e.changedTouches) ? e.changedTouches[0] : e;
      //get x positions of the image
      a = img.getBoundingClientRect();
      //calculate the cursor's x coordinate, relative to the image
      x = e.pageX - a.left;
      //consider page scrolling
      x = x - window.pageXOffset;
      return x;
    }
    function slide(x) {
      //resize the image
      img.style.width = x + "px";
      //position the slider
      slider.style.left = img.offsetWidth - (slider.offsetWidth / 2) + "px";
    }
  }
}


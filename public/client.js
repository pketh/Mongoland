// Metome.io Client

// (╯°□°）╯︵ ┻━┻



$(document).ready(function () {

  var socket = io.connect('http://localhost:8000');
  // var siofu = new SocketIOFileUpload(socket);
  var user = 'pirijan'; // TODO - auth

  socket.on('connect', function () {
    socket.emit('login', user );
    //
  });
  
  // list entries (triggered by connection)
  socket.on('entriesSuccessful', function(titles){
    console.log('entries successfully retrieved');
    titles.forEach(function (titleIndex) {
      if (titleIndex.title === '') {
        $(".entriesList").append('<li data-id = "' + titleIndex._id + '">Blank entry.</li>');
      } else {
        $(".entriesList").append('<li data-id = "' + titleIndex._id + '">' + titleIndex.title+ '</li>');
      }
    });
  });
  
  // request an entry
  $('.entriesList').on('click', 'li', function(){
    var entryID = $(this).data('id');
    socket.emit('entry', entryID);
    // clearEntry();
    // $('entryContainer').empty();
  });

  // load the entry based into .entry
  socket.on('entrySuccessful', function(entry, entryMonth, entryYear, entryID){
    
      // load entryTemplate into entrycontainer
      $('.entryContainer').load('templates/entry.html', function() {

        loadEntry(entry, entryMonth, entryYear, entryID);
        
        // title saving
        $('.title').typing({
          start: function() {
            displaySaving();
          },
          stop: function(event) {
            saveTitle(event, entryID);
          },
          delay: 400
        });
        
        // title: enter acts like tab
        $('.title').on('keypress', function(event) {
          if(event.which == 13) {
            event.preventDefault();
            $('.content').focus();
          }
        });
        
        // content: saving
        $('.content').typing({
          start: function() {
            displaySaving();
          },
          stop: function(event) {
            saveContent(event, entryID);
          },
          delay: 400
        });
        
        // delete button view logic
        $('.delete').on('click', function() {
          $('.delete').addClass('hidden');
          $('.destroyCancel').removeClass('hidden');
        });
        
        // cancel button view logic
        $('.cancel').on('click', function() {
          $('.delete').removeClass('hidden');
          $('.destroyCancel').addClass('hidden');
        });
        
        // destroy/remove entry
        $('.destroy').on('click', function(){
          var entryID= $('.entry').attr('data-id');
          console.log('delete triggered for ' + entryID)
          socket.emit('removeEntry', entryID);
        });

        // trigger input on btn click
        $('.btn-newFile').on('click', function () {
          $('input').click()
        })
        
    });
  }); // close entry

  // settings view
  $('.settings').on('click', function(){
    console.log('settings clicked')
  });

  // make new entry
  $('.newEntry').on('click', function(){
    socket.emit('newEntry');
  });
  socket.on('newEntrySuccess', function(entryID){
    $('.entriesList').prepend('<li data-id = "' + entryID + '">Blank entry.</li>');
    console.log('new entry created ' + entryID);
    socket.emit('entry', entryID);
  });

  // showing successful save
  socket.on('saveSuccess', function(entryID) {
    console.log('Saved ' + entryID);
    displaySaved();
  });

  // when entry sucessfully removed
  socket.on('removeEntrySuccess', function(entryID) {
    entryListRemove(entryID);
    viewEntries(entryID); // --> replace with updateList(entryID)?
  });

  // -------------------------------------------------------------------------


  socket.on('disconnect', function(){
    console.log("I'm disconnected")
    //'connection error'
    // switch into 'read only mode' = no text area editing / diff styling (greyed out a bit)
    // "disconnect" is emitted when the socket disconnected
    // http://stackoverflow.com/questions/3297923/make-textarea-readonly-with-jquery
  });

  socket.on('reconnecting', function(){
    console.log("I'm reconnecting")
    // reconnecting - is emitted when the socket is attempting to reconnect with the server
  });
  
  socket.on('reconnect_failed', function(){
    console.log("My reconnect failed")
    // reconnect failed - emitted when socket.io fails to re-establish a working
  });

  socket.on('reconnect', function(){
    console.log("I reconnected")
    // Q: reconnect fires when connection emits (automatically?)
    // reconnect - emitted when socket.io successfully reconnected to the server
    // on a reconnect event switch contenteditables back to true
    // make sure the list doesn't append again to replicate on top of existing
  });

  // buttons / ui (delete and addCover) visible on load
  // ui present on load
  // trying start fades out ui (save btn , img btn)
  // move mouse triggers it back in

  // --------------------------------------------------------------------------
  
  
  function entryListRemove(entryID) {
    var listItem = $('.entriesList li[data-id=' + entryID + ']')
    listItem.remove();
    console.log(entryID + ' removed from entries list');
  }
  
  function saveTitle(event, entryID) {
    var newTitle = $('.title').val();
    socket.emit('titleEdited', { title: newTitle }, entryID);
    console.log('Saving... ' + 'title ' + entryID);
    console.log(newTitle);
    var listItem = $('.entriesList li[data-id=' + entryID + ']')
    listItem.empty().append(newTitle);
  }
  
  function saveContent(event, entryID) {
    var newContent = $('.content').val();
    socket.emit('contentEdited', { content: newContent }, entryID);
    console.log('Saving... ' + newContent + ' entryID ' + entryID);
  }
  
  function displaySaving() {
    $('.status span').replaceWith('<span>' + 'Saving...' + '</span>');
  }
  
  function displaySaved() {
    $('.status span').replaceWith('<span>' + 'Saved' + '</span>');
  }
  
  // back to viewing the entries list
  function viewEntries(entryID) { // triggered by browser back. or deleting an entry
    console.log('verifying that viewEntries has ID: ' + entryID);
    // DO LATER: move the view back to the entries list
    $('.entry').remove();
  }
  

  
  function loadEntry(entry, entryMonth, entryYear, entryID) {
    var months = {
      0:'Jan', 1:'Feb', 2:'Mar', 3:'Apr', 4:'May', 5:'Jun', 6:'Jul', 7:'Aug', 8:'Sep', 9:'Oct', 10:'Nov', 11:'Dec'
    }
    var entryMonthStr = months[entryMonth] // entryMonth is between 0 and 11
    $('.entry').attr('data-id', entryID);
    $('.entry .title').append(entry.title);
    $('.entry .content').append(entry.content);
    $('.status').prepend('<span>' + entryMonthStr + ', ' + entryYear + '</span>');
    $('.content').autosize();
    $('.title').focus();
    if (!(window.File && window.FileReader)) {
      $('.btn-newFile').addClass('hidden')
    }
    sendFile(entryID);
  }
  
  function sendFile(entryID) {
    $('input').change(function() {
      var file = this.files[0]
      var fileSize = file.size
      var fileName = file.name
      // file size gate
      var fileSizeLimit = 15000000 // ~15mb
      if (fileSize <= fileSizeLimit) {
        // get preview blob
        var windowURL = window.URL || window.webkitURL
        var blobURL = windowURL.createObjectURL(this.files[0])
        // render preview
        $('.file').removeClass('hidden');
        $('.cover').removeClass('hidden');
        $('.btn-newFile').addClass('btn-replaceFile');
        $('.fileSizeError').addClass('hidden')
        $('.cover').attr('src', blobURL );
        
        console.log(file.name);
        console.log(file.type);
        console.log(file.size);
        console.log(file);
        
        socket.emit('startSend', fileName, fileSize, entryID);
        // read the file to server
        var reader = new FileReader();
        reader.onload = function(event) {
          var data = event.target.result;
          // console.log(data);
          socket.emit('sendPiece', data, fileName, fileSize, entryID);
        }
        socket.on('morePlease', function (place, entryID, percent){
          progressUpdate(percent);
          var startPlace = place * 524288; // The Next Blocks Starting Position
          // var newBlock; // The Variable that will hold the new Block of Data
          // if(file.webkitSlice)
          //     newBlock = file.webkitSlice(startPlace, startPlace + Math.min(524288, (fileSize-startPlace)));
          // else
          var newBlock = file.slice(startPlace, startPlace + Math.min(524288, (fileSize-startPlace)));
          reader.readAsBinaryString(newBlock); // triggers reader onload
        });
        function progressUpdate(percent){
          console.log('current percent is: ' + percent + '%')
          // use normal progress as 0min to 100max for this
          // document.getElementById('ProgressBar').style.width = percent + '%';
          // document.getElementById('percent').innerHTML = (Math.round(percent*100)/100) + '%';
          // do something to progress when its 100
        }
        socket.on('sendSuccessful', function(entryID){
          console.log('sendSuccessful triggered. File should be in temp folder.')
        });
        
        
        
        
        
        
        
        
      } else {
        // file size is too big
        $('.file').removeClass('hidden');
        $('.cover').addClass('hidden');
        var fileSizeLimitConverted = Math.round(fileSizeLimit / 1000000)
        $('.fileSizeError span').append(fileSizeLimitConverted + 'mb');
        $('.fileSizeError').removeClass('hidden'); // render the fileSizeError message
      }
    })
  }
  
  socket.on('sendFileSuccess', function(entryID){
    // server tells us that file upload complete here (and path added to db)
    console.log('sendFileSuccess for ' + entryID);
    $('progress').removeClass('hidden').attr('value', 0);
  });


}); // close domready














































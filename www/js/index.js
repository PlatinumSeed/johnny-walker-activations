/* ::Johnnie Walker Red Sales Actition App  */
/* ----------------------------------------------------------- */

//Init the database
var database = {
    database: null,
    name: 'JohnnieWalkerRedActivation',
    version: '1.0',
    displayName: 'Johnnie Walker Red Activations',
    size: 200000,
    init: function() {
        var _this = window.openDatabase(this.name, this.version, this.displayName, this.size);
        return _this;
    }
};
var db = database.init();

function activation(data) {
     a = typeof a !== 'undefined' ? a : 42;
    this.id = null;
    this.venue = typeof data.venue !== 'undefined' ? data.venue : null;
    if (typeof data.date !== 'undefined' && typeof data.time !== 'undefined') {
        this.date_time = data.date+' '+data.time;
    }
    else {
        this.date_time = null;
    }
    this.additional_comments = typeof data.additional_comments !== 'undefined' ? data.additional_comments : null;
    this.attendance  = 0
    this.game1_total = 0;
    this.game1_wins  = 0;
    this.game2_total = 0;
    this.game2_wins  = 0;
    this.game3_total = 0;
    this.game3_wins  = 0;
    this.synced      = 0;
};

function contact(data, activation_id) {
    this.id                = null;
    this.first_name        = typeof data.first_name !== 'undefined' ? data.first_name : null;
    this.last_name         = typeof data.last_name !== 'undefined' ? data.last_name : null;
    this.email             = typeof data.email !== 'undefined' ? data.email : null;
    this.mobile_number     = typeof data.mobile_number !== 'undefined' ? data.mobile_number : null;
    this.gender            = typeof data.gender !== 'undefined' ? data.gender : null;
    this.twitter_handle    = typeof data.twitter_handle !== 'undefined' ? data.twitter_handle : null;
    this.newsletter_signup = typeof data.newsletter_signup !== 'undefined' ? data.newsletter_signup : null;
    this.activation_id     = typeof activation_id !== 'undefined' ? activation_id : null;
    this.game_result       = null;
    this.synced            = 0;
};

var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];

var app = {
    //Variables
    menu_open: false,
    //Game 2 state
    game2Active: true,
    //API
    api_url: 'http://jwserver.platinumseed.com/api/v1',
    //Modals
    currentContact: [],
    // Application Constructor
    initialize: function() {
        //Init the DB
        this.createDB();

        //Uncomment to Destroy the DB
        //this.destroyDB();

        //Init event binding
        this.bindEvents();

        //Reset past activation
        this.initActivation();
        
        //Custom Checkboxes
        $('input').iCheck();

        //Init Form Calidation
        this.initValidation();

        //Game 1 Sortable
        this.initSortable();

        //Game 3 answer selection
        this.answerSelect();    
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);

        window.addEventListener('load', function() {
            FastClick.attach(document.body);
        }, false);

        //Bind event on tapping action item
        that = this;
        $(document.body).on('click', '.action', function(event) {
            event.preventDefault();
            event.stopPropagation();
            $('input, textarea').blur();
            that[$(this).data('action')](event);
        });

        //Page change event
        $(document.body).on('pageChange', function(event, page){
            that.onPageChange(event, page);
        });

        //Form label effects
        $('form').on('focus', 'input, textarea', this.focusInputActive);
        $('form').on('blur', 'input, textarea', this.blurInputActive);

        //Game2 option selections
        $(document.body).on('click tap', '.game2_checkboxes li.open', this.submitGame2);

        //Game3 slider events
        $( '.cycle-slideshow' ).on( 'cycle-before', function( event, optionHash, outgoingSlideEl, incomingSlideEl, forwardFlag ) {
            $('#advance').hide(); 
        });

        //Remove focus of text input when checkbox is clicked, prevents keyboard popping up
        $('input').on('ifClicked', function(event){
            $('input, textarea').blur();
        });

        //Removed error validation on age verify when checked
        $('input[name="age_verify"]').on('ifChecked', function(event){
            $('label[for="age_verify"]').attr('id', '');
        });
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        document.addEventListener("showkeyboard", function(){ $('.logo, footer').hide(); }, false);
        document.addEventListener("hidekeyboard", function(){ $('.logo, footer').show();}, false);
        window.device_id = device.uuid;
    },

    //Database Section
    //----------------------------------------------------------------------------------------------------------------------
    createDB: function(tx) {
        db.transaction(this.structureDB, this.errorDB, this.syncWatch);
    },
    structureDB: function(tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS activations( id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, venue TEXT NOT NULL, date_time TEXT NOT NULL, attendance INTEGER, additional_comments TEXT, game1_total INTEGER, game1_wins INTEGER, game2_total INTEGER, game2_wins INTEGER, game3_total INTEGER,  game3_wins INTEGER, synced INTEGER, device_id VARCHAR)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS contacts ( id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, first_name TEXT NOT NULL, last_name TEXT NOT NULL, email TEXT NOT NULL, mobile_number TEXT NOT NULL, gender TEXT NOT NULL, twitter_handle TEXT, newsletter_signup TEXT, activation_id INTEGER, game_result TEXT, synced INTEGER, device_id VARCHAR)');
    },
    createActivation: function(event){  
        var data = $(event.currentTarget).serializeFormJSON();
        this.currentActivation = new activation(data);
        //Save in local DB
        this.storeActivation(this.currentActivation);
        //Set venue and data of activation on front end
        var date = new Date(this.currentActivation.date_time),
            activationDate = date.getDate() + ' ' + monthNames[date.getMonth()] + ' ' + date.getFullYear();
        $('.activation_venue').html(this.currentActivation.venue);
        $('.activation_date').html(activationDate);
        //Set activation state to open
        this.currentActivation.activation_open = true;
        //Go to activation management page
        EffecktPageTransitions.transitionPage( 'activation', 'slide-from-right', 'slide-to-left' );
    },
    storeActivation: function() {
        var that = this;
        db.transaction(function(tx){
            tx.executeSql(
                'INSERT INTO activations (venue, date_time, attendance, game1_total, game1_wins, game2_total, game2_wins, game3_total, game3_wins, synced, device_id) VALUES ("'+that.currentActivation.venue+'", "'+that.currentActivation.date_time+'", "0", "0", "0", "0", "0", "0", "0", "0", "'+window.device_id+'")',
                [],
                function(tx, results) {
                    that.currentActivation.id = results.insertId;
                }
            );
        }, that.errorDB, function(){
            that.resetform('new_activation');
        });
    },
    createContact: function(event) {
        var games = ['game_1', 'game_2', 'game_3'],
            weight = [0.6, 0.2, 0.2],
            //Generate a weighted list of 100 items from which to select a random game
            generateWeighedList = function(list, weight) {
                var weighed_list = [];
                // Loop over weights
                for (var i = 0; i < weight.length; i++) {
                    var multiples = weight[i] * 100;
                    // Loop over the list of items
                    for (var j = 0; j < multiples; j++) {
                        weighed_list.push(list[i]);
                    }
                }
                return weighed_list;
            },
            //generate random number
            rand = function(min, max) {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            },
            weighed_list = generateWeighedList(games, weight),
            //Get weighted random game key
            randomGameKey = rand(0, weighed_list.length-1),
            //Get weighted random game
            weightedRandomGame = weighed_list[randomGameKey];

        var data = $(event.currentTarget).serializeFormJSON();
        if (data.newsletter_signup != 'yes') {
            data.newsletter_signup = 'no';
        }
        this.currentContact = new contact(data, this.currentActivation.id);
        //Save to local DB
        this.storeContact();
        //Go to a random game
        EffecktPageTransitions.transitionPage( weightedRandomGame, 'slide-from-bottom', 'slide-to-top', weightedRandomGame );
    },
    storeContact: function() {
        var that = this;
        db.transaction(function(tx){
            tx.executeSql(
                'INSERT INTO contacts (first_name, last_name, email, mobile_number, gender, twitter_handle, newsletter_signup, activation_id, synced, device_id) VALUES ("'+that.currentContact.first_name+'", "'+that.currentContact.last_name+'", "'+that.currentContact.email+'", "'+that.currentContact.mobile_number+'", "'+that.currentContact.gender+'", "'+that.currentContact.twitter_handle+'", "'+that.currentContact.newsletter_signup+'", "'+that.currentContact.activation_id+'", "0", "'+window.device_id+'")',
                [],
                function(tx, results) {
                    that.currentContact.id = results.insertId;
                }
            );
        }, that.errorDB, that.resetform('details'));
    },
    updateGameResults: function(game_number) {
        game_total = this.currentActivation['game'+game_number+'_total'];
        game_wins = this.currentActivation['game'+game_number+'_wins'];

        sqlStatement = 'UPDATE activations SET game'+game_number+'_total="'+game_total+'", game'+game_number+'_wins="'+game_wins+'" WHERE id='+this.currentActivation.id;
        sqlStatement2 = 'UPDATE contacts SET game_result="'+this.currentContact.game_result+'" WHERE id='+this.currentContact.id;
        
        db.transaction(function(tx){
            tx.executeSql(sqlStatement);
            tx.executeSql(sqlStatement2);
        }, this.errorDB, this.resetGame(game_number));
    },
    endActivation: function(event) {
        var that = this;
        var data = $(event.currentTarget).serializeFormJSON(),
            sqlStatement  = 'UPDATE activations SET attendance="'+data.attendance+'", additional_comments="'+data.additional_comments+'" WHERE id='+this.currentActivation.id;
        db.transaction(function(tx){
            tx.executeSql(sqlStatement);
        }, that.errorDB, function(){
            that.initActivation();
            //Unset current activation
            delete that.currentActivation;
            EffecktPageTransitions.transitionPage( 'new_activation', 'slide-from-bottom', 'slide-to-top' );
            that.resetform('end_activation');
        });
    },
    getTable: function(table, sync) {
        table = typeof table !== 'object' ? table : 'activations';
        sync = typeof sync !== 'undefined' ? sync : false;

        var sqlStatement = 'SELECT * FROM ' + table,
            that = this;

        db.transaction(function (tx) {
            tx.executeSql(sqlStatement, [], function (tx, results) {
                var len = results.rows.length, i;

                if (len > 0) {
                    if (sync) {
                        that.serverSync(table, results);
                    }
                    else {
                        that.buildResultsTable(results);
                        EffecktPageTransitions.transitionPage( 'activation_reports', 'slide-from-bottom', 'slide-to-top' );
                    }
                    
                }
                else {
                    alert('There are currently no activations');
                }
                
            });
        });
    },
    destroyDB: function() {
        db.transaction(function (tx) {
            tx.executeSql('DROP TABLE activations');
            tx.executeSql('DROP TABLE contacts');
        }, this.errorDB, this.successDB);
    },
    errorDB: function(err) {
        alert("Error processing SQL: "+err.message);
    },
    successDB: function() {
        console.log('db success');
    },

    //Data Sync
    //----------------------------------------------------------------------------------------------------------------------
    dataSync: function() {
        $('.loading').show();
        //Get All Data that has not yet been synced
        var sqlStatement1 = 'SELECT * FROM activations WHERE synced=0',
            sqlStatement2 = 'SELECT * FROM contacts WHERE synced=0',
            activationsToSync = [],
            contactsToSync = [],
            syncData = {info: 'riaan@platinumseed.com'},
            that = this;


        db.transaction(function(tx){
            tx.executeSql(
                sqlStatement1,[],
                function(tx, results) {
                    activationsToSync = that.convertResults(results);
                    console.log(activationsToSync)
                    syncData.activations = activationsToSync;
                }
            );
            tx.executeSql(
                sqlStatement2,[],
                function(tx, results) {
                    contactsToSync = that.convertResults(results);
                    console.log(contactsToSync)
                    syncData.contacts    = contactsToSync;
                }
            );
        }, that.errorDB, function(){
            //Check if theres anything to sync
            if (syncData.activations.length > 0 || syncData.contacts.length > 0) {
                //Send data to the server
                $.ajax({
                    type: 'post',
                    url: that.api_url,
                    data: syncData,
                    processData: false,
                    beforeSend: function (jqXHR, settings) {
                        jqXHR.activation = settings.data;
                        settings.data = jQuery.param(settings.data, false);
                    },
                    success: function(result, textStatus, jqXHR) {
                        console.log(result);
                        //Mark All data as synced
                        sqlStatement   = 'UPDATE activations SET synced=1 WHERE synced=0';
                        sqlStatement2  = 'UPDATE contacts SET synced=1 WHERE synced=0';
                        db.transaction(function(tx){
                            tx.executeSql(sqlStatement);
                            tx.executeSql(sqlStatement2);
                        }, that.errorDB, that.successDB);
                        alert('Your activations have been successfully synced with the server');
                        $('.loading').hide();
                    },
                    error: function(jqXHR, textStatus, errorThrown) {
                        console.log(errorThrown);
                        alert('There was a problem syncing your data, please check your internet connection and try again');
                        $('.loading').hide();
                    }
                });
            }
            else {
                alert('All your activations are already in sync');
                $('.loading').hide();
            };
            
        });     
    },
    
    //Housekeeping
    //----------------------------------------------------------------------------------------------------------------------
    resetform: function(form_class) { //Reset the form (specified by form_class) values
        $("."+form_class+" input, ."+form_class+" textarea").each(function(){
            if ($(this).attr('type') == 'checkbox') {
                $(this).iCheck('uncheck');
            }
            else if ($(this).attr('type') == 'radio') {
                $(this).iCheck('uncheck');
                $('input.male_check').iCheck('check').val('male');
            }
            else {
                $(this).val('');
            }
            //Removed previous validation error states
            $('.errorState').removeClass('errorState');
            $('#errorState').attr('id', '');
        })
    },
    resetGame: function(game_number) { //Reset game input
        if (game_number == 1) {
            $('.sortable').randomize('.sortable_item');
        }
        else if (game_number == 2) {
            $('.game2_checkboxes li').each(function(){
                $(this).addClass('open').removeClass('checked')
            });
            this.answersCorrect = 0;
            this.answersIncorrect = 0;
            this.game2Active = true;
            $('.submit_game2').hide();
        }
        else if (game_number == 3) {
            $('.question_options .option').each(function(){
                $(this).removeClass('selected');
            })
            $('.game3_next_question, .game3_submit').hide();
            $('.cycle-slideshow').cycle('goto', 0);
        }
        else {
            return false;
        }
    },
    //Convert Websql to JSON
    convertResults: function(resultset) {
        var results = [];
        for(var i=0,len=resultset.rows.length;i<len;i++) {
            var row = resultset.rows.item(i);
            var result = {};
            for(var key in row) {
                result[key] = row[key];
            }
            results.push(result);
        }
        return results;
    },

    //UI section
    //----------------------------------------------------------------------------------------------------------------------
    initActivation: function() {
        $(document.body).trigger('pageChange', 'new_activation');

        var currentdate = new Date();
        var date = currentdate.getFullYear()+'-'+('0' + (currentdate.getMonth()+1)).slice(-2)+'-'+('0' + currentdate.getDate()).slice(-2);
        var time = ('0' + currentdate.getHours()).slice(-2)+':'+('0' + currentdate.getMinutes()).slice(-2);
        $('input[name="date"]').val(date);
        $('input[name="time"]').val(time);
    },
    //Validation
    initValidation: function() {
        $('form').validate({
            onChange: true,
            sendForm: false,
            valid: function(event, options) {
                console.log('valid form');
                var formAction = $(this).data('form-action');
                that[formAction](event);
            },
            eachInvalidField: function(event, status, options) {
                if ($(this).attr('type') == 'checkbox') {
                    $('.age_verify_label').attr('id', 'errorState');
                    //console.log('check error');
                }
                else {
                    $(this).parents('label').addClass('errorState');
                }
            },
            eachValidField: function(event, status, options){
                if ($(this).attr('type') == 'checkbox') {
                    $('label[for="age_verify"]').removeClass('errorState');
                }
                else {
                    $(this).parents('label').removeClass('errorState');
                }
            }
        });

        //Extra validation rules
        jQuery.validateExtend({
            email : {
                required : true,
                pattern : /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            },
            digit : {
                required : true,
                pattern : /^[0-9]*$/
            }
        });
    },
    //Open Menu
    openMenu: function(event) {
        $('main').addClass('open');
        $('.menu_open').hide();
        this.menu_open = true;
    },
    //Close Menu
    closeMenu: function(event) {
        $('main').removeClass('open');
        $('.menu_open').show();
        this.menu_open = false;
    },
    //Form input label effect
    blurInputActive: function(event) {
        if(!$(this).val() || $(this).val() == '@') {
            $(this).parents('label').removeClass('active');
        }
    },
    focusInputActive: function(event) {
        if(!$(this).val() || $(this).val() == '@') {
            $(this).parents('label').addClass('active');
        }
    },
    //Set the checkbox to checked when parent box is tapped
    setCheck: function(event) {
        event.preventDefault();
        var target = event.target;

        if (target.localName == 'div') {
            $('input', target).iCheck('toggle');
        }
        else if(target.localName == 'label') {
            $(target).siblings('div').children('input').iCheck('toggle');
        }
        
    },
    //Initialize sortable for game 1
    initSortable: function() {
        $(".sortable").sortable({
            axis: 'x',
            revert: true,
            tolerance: "pointer",
            stop: function( event, ui ) {
                $('.sortable_item').each(function(index, object) {
                    $('.order', this).html(index+1);
                });
            }
        });
    },
    answerSelect: function() {
        $('.option').on('click tap', function(){
            $(this).siblings().removeClass('selected');
            $(this).addClass('selected');
            if ($(this).parents('.slide').hasClass('question4')) {
                $('.game3_submit').show();
            }
            else {
                $('#advance').fadeIn(400);
            }
        });
    },
    buildResultsTable: function(activations) {
        var len = activations.rows.length,
            activations_html = '';

        for (i = 0; i < len; i++) {
            total_entries = activations.rows.item(i).game1_total + activations.rows.item(i).game2_total + activations.rows.item(i).game3_total;
            total_wins = activations.rows.item(i).game1_wins + activations.rows.item(i).game2_wins + activations.rows.item(i).game3_wins;
            activationDate = activations.rows.item(i).date_time.substring(0, 10);
            activations_html += '<div class="table_row"><div class="table_row__item">'+activations.rows.item(i).venue+'('+activationDate+')</div><div class="table_row__item">'+activations.rows.item(i).attendance+'</div><div class="table_row__item">'+total_entries+'</div><div class="table_row__item">'+activations.rows.item(i).game1_wins+'/'+activations.rows.item(i).game1_total+'</div><div class="table_row__item">'+activations.rows.item(i).game2_wins+'/'+activations.rows.item(i).game2_total+'</div><div class="table_row__item">'+activations.rows.item(i).game3_wins+'/'+activations.rows.item(i).game3_total+'</div><div class="table_row__item">'+total_wins+'/'+total_entries+'</div></div>';
        }

        $('.table_body').html(activations_html);
    },
    openTimePicker: function(event) {
        event.stopPropagation();
        var currentField = event.target;
        var opts = {};
        var minVal = 0;
        var maxVal = 0;

        var myNewDate = Date.parse(currentField.val()) || new Date();
        if(typeof myNewDate === "number") {
            myNewDate = new Date (myNewDate);
        }

        window.plugins.datePicker.show({
            date : myNewDate,
            mode : 'date',
            minDate: Date.parse(minVal),
            maxDate: Date.parse(maxVal)
        }, function(returnDate) {
            if(returnDate !== "") {
                var newDate = new Date(returnDate);
                currentField.val(getFormattedDate(newDate));
            }
            currentField.blur();
        });
    },
    onPageChange: function(event, page) {
        //Hide sync button if activation is active
        if (typeof this.currentActivation === 'undefined') {
            $('.menu_sync').show()
            $('.menu_end_activation').hide();
        }
        else {
            $('.menu_sync').hide();
            $('.menu_end_activation').show();
        };
        //Hide menu for client facing pages
        if (page == 'new_activation' || page =='activation') {
            if (this.menu_open) {
                $('.menu_close').show();
            }
            else {
                $('.menu_open').show();
            }
        }
        else {
            $('.menu_open').hide();
        };

    },
    cancelContact: function() {
        EffecktPageTransitions.transitionPage( 'activation', 'slide-from-left', 'slide-to-right' );
        this.resetform('details');
    },
    cancelEnd: function() {
        EffecktPageTransitions.transitionPage( 'activation', 'slide-from-left', 'slide-to-right' );
        this.resetform('end_activation');
    },
    closeReports: function() {
        //Preven going back to activation page if it hasnt been created yet
        if (typeof this.currentActivation === 'undefined') {
            backToPage = 'new_activation';
        }
        else {
            backToPage = 'activation'
        }
        EffecktPageTransitions.transitionPage( backToPage, 'slide-from-top', 'slide-to-bottom' );
    },

    //Game stuff
    //----------------------------------------------------------------------------------------------------------------------
    submitGame1: function() {
        var sortedOrder = $( ".sortable" ).sortable( "toArray" ),
            correctOrder = ["ice", "whiskey", "gingerbeer"];
            win = true;

        for(var i = correctOrder.length; i--;) {
            if(correctOrder[i] !== sortedOrder[i]) {
                win =  false;
            }
        }
        if (win) {
            //You won the game
            console.log('Done with game 1, you won');
            this.currentActivation.game1_total++;
            this.currentActivation.game1_wins++;
            this.currentContact.game_result = 'won';
            this.showSplash('win');
        }
        else {
            //You loose
            console.log('Done with game 1, you loose');
            this.currentActivation.game1_total++;
            this.currentContact.game_result = 'lost';
            this.showSplash('loose');
        };
        this.updateGameResults('1');
    },
    submitGame2: function() {
        if (that.game2Active) {
            $(this).addClass('checked').removeClass('open');
            console.log('correct: '+ $('.checked.correct').length);
            console.log('incorrect: '+ $('.checked.incorrect').length);
            correctCount = $('.checked.correct').length;
            incorrectCount = $('.checked.incorrect').length

            //Win
            if (correctCount == 3) {
                that.game2Active = false;
                console.log('Done with game 2, you won');
                that.currentActivation.game2_total++;
                that.currentActivation.game2_wins++;
                that.currentContact.game_result = 'won';
                that.updateGameResults('2');
                that.showSplash('win');
            }
            //Lose
            if (incorrectCount == 2) {                    
                that.game2Active = false;
                console.log('Done with game 2, you loose');
                that.currentActivation.game2_total++;
                that.currentContact.game_result = 'lost';
                that.updateGameResults('2');
                that.showSplash('loose');
            }
        }
    },
    submitGame3: function() {
        var correctAnswers = ['B', 'B', 'A', 'B']
        win = true;
        for (i = 1; i < 5; i++) { 
             if ($('.question'+i+' .selected').data('option') != correctAnswers[i - 1]) {
                win = false;
            };
        }
        if (win) {
            //You won the game
            console.log('Done with game 3, you won');
            this.currentActivation.game3_total++;
            this.currentActivation.game3_wins++;
            this.currentContact.game_result = 'won';
            this.showSplash('win');
        }
        else {
            //You loose
            console.log('Done with game 3, you loose');
            this.currentActivation.game3_total++;
            this.currentContact.game_result = 'lost';
            this.showSplash('loose');
        };
        this.updateGameResults('3');
    },
    showSplash: function(type) { //Show the splash screen for 5 seconds then hide
        if (type == 'loose') {
            target = $('.splash.loose');
        }
        else if (type == 'win') {
            target = $('.splash.win');
        };
        target.fadeIn(400, function(){
            EffecktPageTransitions.transitionPage( 'activation', 'slide-from-top', 'slide-to-bottom', 'endGame' );
        }).delay(5000).fadeOut(400);
    }
};

//Serialize form input
$.fn.serializeFormJSON = function() {
   var o = {};
   var a = this.serializeArray();
   $.each(a, function() {
       if (o[this.name]) {
           if (!o[this.name].push) {
               o[this.name] = [o[this.name]];
           }
           o[this.name].push(this.value || '');
       } else {
           o[this.name] = this.value || '';
       }
   });
   return o;
};

//Randomize elements
(function($) {
$.fn.randomize = function(childElem) {
  return this.each(function() {
      var $this = $(this);
      var elems = $this.children(childElem);

      elems.sort(function() { return (Math.round(Math.random())-0.5); });  

      $this.detach(childElem);  

      for(var i=0; i < elems.length; i++)
        $this.append(elems[i]);      

  });    
}
})(jQuery);
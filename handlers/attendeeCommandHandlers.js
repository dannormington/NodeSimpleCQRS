var AttendeeDataProvider = require('../infrastructure/attendeeDataProvider.js');
var Attendee = require('../domain/attendee.js');
var Repository = require('../infrastructure/repository.js');

var RegisterAttendee = require('../commands/registerAttendee.js');
var ChangeEmail = require('../commands/changeEmail.js');
var ConfirmChangeEmail = require('../commands/confirmChangeEmail.js');

var Handler = require('./handler.js');

var util = require("util");

util.inherits(AttendeeCommandHandlers, Handler);

//Declare at the module level since the class is a singleton
var repository = new Repository(Attendee);
var attendeeDataProvider = new AttendeeDataProvider();

function AttendeeCommandHandlers(){

  this.onMessage(ConfirmChangeEmail.COMMAND, handleConfirmChangeEmail);
  this.onMessage(ChangeEmail.COMMAND, handleChangeEmail);
  this.onMessage(RegisterAttendee.COMMAND, handleRegisterAttendee);

}

//Handle confirming an email change
function handleConfirmChangeEmail(command, callback){

  //validate the command
  if(!command.confirmationId || command.confirmationId.trim().length === 0){
    callback(new Error('invalid parameters'), false);
    return;
  }

  var id = parseInt(command.id);
  var confirmationId = command.confirmationId;

  repository.getById(id, function(err, attendee){
    if(err){
      callback(err, true);
    }else{

      attendee.confirmChangeEmail(confirmationId);

      repository.save(attendee, function(err){
        if(err){
          callback(err, true);
        }else{
          callback(null, false);
        }
      });
    }
  });
}

//Handles changing an attendee's email
function handleChangeEmail(command, callback){

  //validate the command
  if(!command.email || command.email.trim().length === 0){
    callback(new Error('invalid parameters'), false);
    return;
  }

  //check to see if the email already exists in the read model
  attendeeDataProvider.getAttendeeByEmail(command.email, function(err, existingAttendee){

    if(err){
      callback(err, true);
    }else{

      if(existingAttendee){
        callback(new Error('email already exists.'), false);
      }else{

        var id = parseInt(command.id);
        var email = command.email.trim();

        repository.getById(id, function(err, attendee){
          if(err){
            callback(err, true);
          }else{

            attendee.changeEmail(email);

            repository.save(attendee, function(err){
              if(err){
                callback(err, true);
              }else{
                callback(null, false);
              }
            });
          }
        });
      }
    }
  });
}

//handles the registration of an attendee
function handleRegisterAttendee(command, callback){
  //validate the command
  if(!command || !command.firstName || !command.lastName || !command.email || !command.id ||
    command.firstName.trim().length === 0 ||
    command.lastName.trim().length === 0 ||
    command.email.trim().length === 0){

    callback(new Error('invalid parameters'),false);

    return;
  }

  //check to see if the email already exists in the read model
  attendeeDataProvider.getAttendeeByEmail(command.email, function(err, existingAttendee){

    if(err){
      callback(err, true);
    }else{

      if(existingAttendee){
        callback(new Error('email already exists.'), false);
      }else{

        var attendee = new Attendee(command.id).init(command.firstName, command.lastName, command.email);

        repository.save(attendee, function(err){

          if(err){
            callback(err, true);
          }else{
            callback(null, false);
          }
        });
      }
    }
  });
}

module.exports = new AttendeeCommandHandlers();
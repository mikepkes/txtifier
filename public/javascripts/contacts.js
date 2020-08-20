//import { createPopper } from '@popperjs/core';
const Http = new XMLHttpRequest();


let setMe = function(me) {
    var mes = document.getElementsByClassName("mine");
    while (mes.length|0) {
        mes[0].classList.add("yours")
        mes[0].classList.remove("mine")
    }

    var newMes = document.getElementsByClassName("contact_" + me);
    var len=newMes.length|0;
    for (var i=0; i<len; i=i+1) {
        newMes[i].classList.remove("yours")
        newMes[i].classList.add("mine")
    }
}

let formatPhoneNumber = (str) => {
  //Filter only numbers from the input
  let cleaned = ('' + str).replace(/\D/g, '');
  
  //Check if the input is of correct length
  let match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3]
  };

  return null
};

/* Set the width of the side navigation to 250px */
var openNav = function() {
  document.getElementById("navigator").style.width = "250px";
}

/* Set the width of the side navigation to 0 */
var closeNav = function() {
  document.getElementById("navigator").style.width = "0";
} 

var userAbbreviation = function(name) {
    if (name.match(/^[()0-9\s\-]{4,}/)) {
        return name.slice(-2);
    }
    if (name.indexOf(' ') >= 0) {
        var initials = name.match(/\b\w/g) || [];
        initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase();
        return initials;
    }
    return name;
}

var promptContactName = function(number) {
    var person = prompt("Contact Name for " + number, "");
    if (person != null) {
        const url='update_contact';
        Http.open("POST", url, true);
        Http.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        Http.send(number + "=" + encodeURIComponent(person));
        Http.onreadystatechange = (e) => {
          console.log(Http.responseText);
        }

        var es = document.getElementsByClassName(number);
        for (var i=0, len=es.length|0; i<len; i=i+1|0) {
            es[i].childNodes[1].textContent = person
        }

        var as = document.getElementsByClassName("bubble_" + number);
        for (var i=0, len=as.length|0; i<len; i=i+1|0) {
            var abr = userAbbreviation(person);
            as[i].setAttribute("data-user-abbr", abr);
            as[i].textContent = abr;
        }
    }

}


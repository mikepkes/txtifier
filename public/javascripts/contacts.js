const Http = new XMLHttpRequest();

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

        var as = document.getElementsByClassName("msggroup_" + number);
        for (var i=0, len=as.length|0; i<len; i=i+1|0) {
            as[i].setAttribute("data-user-abbr", userAbbreviation(person));
        }
    }

}


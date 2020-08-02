const Http = new XMLHttpRequest();

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
        for (e in es) {
            es[e].childNodes[1].textContent = person
            console.log(e);
        }
    }

}


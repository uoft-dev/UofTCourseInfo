'use-strict';
/*Licensed under MIT  LICENSE
 *
 * Murad Akhundov 2017
 */
$(document).ready(function () {
    generateTooltips();
});

function generateTooltips() {
    let S_SIZE;
    let S_LINK;
    let S_BREADTH;
    let S_PREEXL;
    let S_INST;
    let S_OFFR;
    let S_MAXT;
    let S_DESRPT;

    let data = [];
    let directory;
    let num = ($(".corInf").length);

    chrome.storage.local.get({
        size: 'medium',
        link: 'website',
        breadths: true,
        prereq: true,
        inst: true,
        sess: true,
        descript: true,
        maxtt: 300

    }, function (items) {
        S_SIZE = items.size;
        S_LINK = items.link;
        S_BREADTH = items.breadths;
        S_PREEXL = items.prereq;
        S_OFFR = items.sess;
        S_MAXT = items.maxtt;
        S_INST = items.inst;
        S_DESRPT = items.descript;
        start();
    });


    function getInfo(code) {
        $.ajax({
            url: "https://cobalt.qas.im/api/1.0/courses/filter?q=code:%22" + code + "%22&key=bolBkU4DDtKmXbbr4j5b0m814s3RCcBm&limit=30",
            success: function (response) {
                data[code] = response;
                load(code, response)

            }
        });
        // return res;


    }

    function getDirectory() {
        let dir;
        const xmlhttp = new XMLHttpRequest();

        xmlhttp.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                dir = JSON.parse(this.responseText);
            }
        };
        xmlhttp.open("GET", chrome.runtime.getURL("../../data/directory.json"), false);
        xmlhttp.send();
        return dir;
    }

    function getDepartment(key) {
        if (S_LINK === "artsci") {
            key = key.replace(/ /g, "-");
            return "https://fas.calendar.utoronto.ca/section/" + key;
        } else {

            for (let i = 0; i < directory.length; i++) {
                let name = directory[i].name.toString().toUpperCase();
                key = key.toUpperCase();
                if (name.startsWith(key)) {
                    return directory[i].url;
                }
            }
            return "https://www.utoronto.ca/a-to-z-directory";
        }

    }


    function getOffers(utm, utsc, utsg) {
        return "<b>UTSG:</b> " + utsg
            + "<br /><b>UTM:</b> " + utm
            + "<br /><b>UTSC:</b> " + utsc;
    }

    function getProfs(profs) {
        return "<b>Instructors:</b> " + profs.join(", ");

    }

    function getDetails(info) {
        let breadths = info[0].breadths;
        if (breadths.length === 0) {
            breadths = "N/A"
        }

        let output = "";
        if (S_PREEXL) {
            output = output + " <b>Prerequisites:</b> " + info[0].prerequisites
                + "<br /><b>Exclusions:</b> " + info[0].exclusions
                + "<br />";
        }
        if (S_BREADTH) {
            output = output + "<b>Breadths:</b> " + breadths + "<br />"
        }
        return output

    }


    function getTitle(info) {
        let dept = getDepartment(info[0].department);
        let deptlink = document.createElement("a");
        deptlink.setAttribute('href', dept);
        deptlink.className = 'card-link';
        deptlink.setAttribute('style', 'margin-left: 10px; float: right; color: lightgray; text-decoration: underline');
        deptlink.innerHTML = '<b>' + info[0].department + '</b>';


        return "" + info[0].name + deptlink.outerHTML;

    }

    function cobaltCourses() {
        $('.corInf').each(function () {
            let title = $(this).data('title');
            let info = data[title];
            if (info == null) {
                getInfo(title)
            }
        })
    }

    function load(code, info) {
        $('.' + code).each(function () {

            try {
                let a = info[0].name;
            } catch (err) {
                $(this).replaceWith($(this).data('title'));
            }


            tippy("." + this.id, {
                content: buildPopover(code, info),
                arrow: true,
                size: 'small',
                theme: 'light',
                interactive: 'true',
                maxWidth: 700
            })


        });
    }

    function start() {

        if (num < S_MAXT) {
            directory = getDirectory();
            cobaltCourses()
        } else {
            $(".corInf").each(function () {
                $(this).replaceWith($(this).data('title'));

            });
            let warning = localStorage.warning || "true";
            if (warning === "true") {
                let show = confirm("UofT Course Info: did not load the contentscripts, too many courses mentioned. " +
                    "\n\n" +
                    "The current limit is " + S_MAXT + ", you can now change it in the settings" +
                    "\n\n Click 'Cancel' to never see this popup again");
                localStorage.warning = show.toString();
            }


        }
    }


    function buildPopover(code, info) {

        let crawled = crawlOfferings(info);

        let slink = document.createElement("a");
        slink.setAttribute("href", getSettingsUrl());
        slink.className = 'font-weight-bold';
        slink.setAttribute('style', 'margin-left: 10px;');
        slink.innerText = "Configure Extension";

        let tlink = document.createElement("a");
        tlink.className = 'font-weight-bold';
        tlink.setAttribute("href", getTextbookUrl(code));
        tlink.innerText = code.toUpperCase() + " Textbooks";

        let main = document.createElement("div");
        main.className = "bootstrapiso";

        let card = document.createElement("div");
        card.className = "card";

        let body = document.createElement("div");
        body.className = "card-body";

        let description = document.createElement("p");
        description.className = "card-text";
        description.innerText = info[0].description;

        let details = document.createElement("p");
        details.className = "card-text";
        details.innerHTML = getDetails(info);

        let offerings = document.createElement("p");
        offerings.className = "card-text";
        offerings.innerHTML = getOffers(crawled.utm, crawled.utsc, crawled.utsg);

        let extralinks = document.createElement("span");
        extralinks.setAttribute('style', 'float: right; margin-left: 10px;');
        extralinks.innerHTML = tlink.outerHTML + "  " + slink.outerHTML;

        let lastline = document.createElement("p");
        lastline.className = "card-text";
        if (S_INST) lastline.innerHTML = getProfs(crawled.profs);
        lastline.append(extralinks);

        let heading = document.createElement("div");
        heading.className = "card-header bg-primary text-white";

        let card_title = document.createElement("h6");
        card_title.className = "card-text";
        card_title.innerHTML = code.toUpperCase() + ": " + getTitle(info);

        card.append(heading);
        card.append(body);
        heading.append(card_title);
        if (S_DESRPT) body.append(description);
        if (S_BREADTH || S_PREEXL) body.append(details);
        if (S_OFFR) body.append(offerings);
        body.append(lastline);
        main.append(card);

        return main.outerHTML;
    }
}
// This code gets included just for the popup when the extension icon is clicked.
"use strict";

// Parse the location.search query string
function parseLocationQuery(s) {
    if (s.startsWith("?")) s = s.substr(1);
    if (s == "") return {};
    const params = {};
    const parts = s.split('&');
    for (let i = 0; i < parts.length; i++)
    {
        let p = parts[i].split('=', 2);
        if (p.length == 1) {
            params[p[0]] = "";
        } else {
            params[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
        }
    }
    return params;
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const location = new URL(tabs[0].url);
    const el = document.body;

    // Clear children
    while (el.firstChild) el.removeChild(el.firstChild);

    routePopup(el, location);
});

function routePopup(el, location) {
    // This query will only enter if the appropriate URL structure has already
    // been matched, so we can make some assumptions about the structure of
    // the URL.
    if (location.hostname.startsWith('keybase.')) {
        // For keybase.io and keybase.pub
        const username = location.pathname.split('/')[1];
        return renderPopup(el, username, 'keybase');

    } else if (location.hostname.endsWith('reddit.com')) {
        const username = location.pathname.split('/')[2];
        return renderPopup(el, username, 'reddit');

    } else if (location.hostname.endsWith('twitter.com')) {
        const username = location.pathname.split('/')[1];
        return renderPopup(el, username, 'twitter');

    } else if (location.hostname.endsWith('github.com')) {
        const username = location.pathname.split('/')[1];
        return renderPopup(el, username, 'github');

    } else if (location.hostname == "news.ycombinator.com") {
        const qs = parseLocationQuery(location.search);
        const username = qs["id"];
        if (username) {
            return renderPopup(el, username, 'hackernews');
        }
    }
}

function renderPopup(el, username, service) {
    const div = document.createElement("div");
    div.className = "keybase-reply";
    el.appendChild(div);

    const user = new User(username, service)
    const f = renderChat(div, user, false /* nudgeSupported */, function closeCallback() {
        window.close();
    });

    // Sigh: This is a sad hack because the popup's DOM state seems to be
    // unpredictable and our normal imperative stuff doesn't always work
    // in the initial rendering phase so this is a workaround:
    setTimeout(function() {
        // Select the textarea. Seems the popup overrides the default selected
        // element, maybe because you're clicking on an icon to achieve it.
        f["keybase-chat"].focus();

        // Resize the window a tiny bit which forces a subtle rerender that
        // fixes a bug where the popup is rendered in the wrong size initially
        // sometimes.
        document.body.style.height = window.innerHeight + 1 + "px";
        setTimeout(function() {
            // We can't remove the property too soon or otherwise it happens
            // before the popup render glitch. We'd rather not keep it either
            // because the size of our widget can change after some UI flows.
            document.body.style.removeProperty("height");
        }, 100);
    }, 200);
}

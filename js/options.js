/*
 ========================================
 News Feed - Chrome Extension
 ----------------------------------------
 envato.awedoo.com/codecanyon/newsfeed
 ----------------------------------------
 Copyright (c) 2016 by Awedoo Studio
 ----------------------------------------
 All rights reserved.
 ========================================
 */

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

$(document).ready(function () {

    var show_feed_ids = [];

    if (config["show_extended_options"] === 'yes') {

        for (var i = 0; i < config["feeds"].length; i++) {
            show_feed_ids = (localStorage["show_feed_ids"] !== '') ? localStorage["show_feed_ids"].split(',') : [];
            var feed_show_checked = (show_feed_ids[i]) ? 'checked="checked"' : '';
            var feed_notifications_checked = (localStorage[i + "_feed_notifications"] === 'yes') ? 'checked="checked"' : '';
            var feed_item = '<div class="feed_item">' + config["feeds"][i]["feed_title"] +
                '<span class="notification_check tooltip--top" data-tooltip="' + chrome.i18n.getMessage("options_hide_notifications") + '?"><input type="checkbox" class="feed_notify" id="' + i + '_feed_notifications" name="' + i + '_feed_notifications" ' + feed_notifications_checked + '/><label for="' + i + '_feed_notifications"></label></span>' +
                '<span class="show_check tooltip--top" data-tooltip="' + chrome.i18n.getMessage("options_hide_feed") + '?"><input type="checkbox" class="feed_show" id="' + i + '_feed_show" data-id="' + i + '" name="' + i + '_feed_show" ' + feed_show_checked + '/><label for="' + i + '_feed_show"></label></span>' +
                '</div>';
            $(".feeds").append(feed_item);
        }

    } else {
        
        var show_notify_checked = (localStorage["notify"] === 'true') ? 'checked="checked"' : '';
        $(".feeds").append(chrome.i18n.getMessage("options_show_notifications") + ': <span class="show_check tooltip--top" data-tooltip="' + chrome.i18n.getMessage("options_hide_notifications") + '"><input type="checkbox" id="show_notifications" name="show_notifications" '+ show_notify_checked +'/><label for="show_notifications"></label></span>');

    }


    $('title').text(chrome.i18n.getMessage("options_title"));
    $('label[for="change-time"]').text(chrome.i18n.getMessage("options_time_update"));


    $('#show_notifications').on('change', function () {

        if ($(this).is(":checked")) {

            localStorage["notify"] = 'true';

        } else {

            localStorage["notify"] = 'false';

        }

    });

    var changeTime = localStorage["time"];

    $('#change-time').on('change', function () {

        changeTime = $(this).val();
        localStorage["time"] = changeTime;

    });


    $('.feed_show').change(function () {
        var check = $(this).is(":checked");
        var id = $(this).attr('id');
        if (check) {
            show_feed_ids = (localStorage["show_feed_ids"] !== '') ? localStorage["show_feed_ids"].split(',') : [];
            show_feed_ids.push($(this).attr('data-id'));
            localStorage["show_feed_ids"] = show_feed_ids.join(',');
        }
        else {
            show_feed_ids = (localStorage["show_feed_ids"] !== '') ? localStorage["show_feed_ids"].split(',') : [];
            show_feed_ids.splice(show_feed_ids.indexOf($(this).attr('data-id')), 1);
            var unread_news = (localStorage[$(this).attr('data-id') + "_feed_events_ids"] !== '') ? localStorage[$(this).attr('data-id') + "_feed_events_ids"].split(',') : [];
            localStorage['badge_count'] = parseInt(localStorage['badge_count']) - unread_news.length;
            localStorage[$(this).attr('data-id') + "_feed_events_ids"] = '';
            localStorage[$(this).attr('data-id') + "_feed_ids"] = '';
            localStorage[$(this).attr('data-id') + "_notification_id"] = '';
            localStorage["show_feed_ids"] = show_feed_ids.join(',');
            if (show_feed_ids.length === 0) {
                localStorage['badge_count'] = 0;
            }
        }
        setBadgeCount(localStorage['badge_count']);
    });

    $('.feed_notify').change(function () {
        var check = $(this).is(":checked");
        var id = $(this).attr('id');
        if (check) {
            localStorage[id] = 'yes';
        }
        else {
            localStorage[id] = 'no';
        }
    });

    var time_update_title = chrome.i18n.getMessage("options_time_update_value").split(',');
    var time_update_value = ['1', '5', '15', '30', '60', '120'];
    for (var z = 0; z < time_update_value.length; z++) {
        $("#change-time").append('<option value="' + time_update_value[z] + '">' + time_update_title[z] + '</option>');
    }

    $('#change-time').val(localStorage["time"]);

    $(".site-title").text(config['title']);
    $(".site-url").html('<a href="http://codecanyon.net/item/news-feed-chrome-extension/10391318?ref=awedoo" target="_blank">' + config['site_url'] + '</a>');
});

function setBadgeCount(count) {
    count = (count == '0') ? '' : count;
    chrome.browserAction.setTitle({title: chrome.i18n.getMessage("badge_text") + count});
    chrome.browserAction.setBadgeBackgroundColor({color: config["badge_color"]});
    chrome.browserAction.setBadgeText({text: count});
}

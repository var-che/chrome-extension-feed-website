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

    chrome.browserAction.setBadgeBackgroundColor({color: config["badge_color"]});

    chrome.browserAction.getBadgeText({}, function (Badge_txt) {
        var mark = $('.btn-clear');
        if (Badge_txt === '') {
            mark.addClass('none');
        } else {
            mark.removeClass('none');
        }

    });

    $('title').text(config['title']);
    $('.btn-clear').attr("title", chrome.i18n.getMessage("mark_read"));

    var show_feed_ids = [];
    show_feed_ids = (localStorage["show_feed_ids"] !== '') ? localStorage["show_feed_ids"].split(',') : [];

    for (var i = 0; i < show_feed_ids.length; i++) {

        var active, none;
        if (i !== 0) {
            active = 'notactive';
            none = 'none';
        }
        else {
            active = 'active';
            none = '';
        }

        var news_count = [];
        news_count[show_feed_ids[i]] = [];

        if (localStorage[show_feed_ids[i] + "_feed_events_ids"]) {
            news_count[show_feed_ids[i]] = localStorage[show_feed_ids[i] + "_feed_events_ids"].split(',');
            counter = news_count[show_feed_ids[i]][0] === '' ? '' : '<span>' + news_count[show_feed_ids[i]].length + '</span>';
        } else {
            counter = '';
        }
        $('#content').append('<div class="news type-' + config["feeds"][show_feed_ids[i]]["feed_view"] + ' ' + none + '" data-id="' + show_feed_ids[i] + '"><ul class="feed"></ul></div>');
        $('ul.menu').append('<li data-id="' + show_feed_ids[i] + '" class="' + active + '">' + config["feeds"][show_feed_ids[i]]["feed_title"] + counter + '</li>');


    }


    $('ul.menu').addClass("list-" + show_feed_ids.length);

    if (config['site_url'] !== "") {
        var logo = $('#logo');
        logo.empty();
        logo.html('<a href="http://codecanyon.net/item/news-feed-chrome-extension/10391318?ref=awedoo" title="' + config['title'] + '" target="_blank"><img src="img/logo.png"/></a>');
    }

    if (config['settings_button'] == "show") {

        $(".btn-settings").removeClass("none");
        $('.btn-settings').attr("title", chrome.i18n.getMessage("options_title"));

    }

    if (show_feed_ids.length <= 1) {

        $('#nav').addClass('none');
        $('body').addClass('nomenu');
    }

    if (show_feed_ids.length > 4) {

        $('.menu').css('width', '1530px');
        getWidth();

    }

    if (show_feed_ids.length !== 0) {
        var first = show_feed_ids[0];
        getContent(first, config["feeds"][first]["feed_url"], config["feeds"][first]["feed_type"], config["feeds"][first]["feed_more_button"], config["feeds"][first]["feed_socials"], config["feeds"][first]["feed_description"], config["feeds"][first]["feed_image"], config["feeds"][first]["feed_image_type"]);
    } else {
        $(".nofeeds").append('<div><p>' + chrome.i18n.getMessage("nofeeds_message") + '</p><button class="btn btn-settings">' + chrome.i18n.getMessage("options_title") + '</button></div>');
        $('#preloader').addClass('none');
    }

    $('.menu li').on('click', function () {
        var z = $(this).index();
        $('.news').addClass('none');
        $('.news[data-id="' + show_feed_ids[z] + '"]').removeClass('none');
        $('.menu li').attr('class', 'notactive');
        $(this).attr('class', 'active');
        $('#preloader').removeClass('none');
        if ($('.news[data-id="' + show_feed_ids[z] + '"]').find('div').is('.jspContainer')) {
            $('#preloader').addClass('none');
        } else {
            var index = show_feed_ids[z];
            getContent(index, config["feeds"][index]["feed_url"], config["feeds"][index]["feed_type"], config["feeds"][index]["feed_more_button"], config["feeds"][index]["feed_socials"], config["feeds"][index]["feed_description"], config["feeds"][index]["feed_image"], config["feeds"][index]["feed_image_type"]);
        }
        if (z !== 0) {
            $('.news[data-id="' + show_feed_ids[z] + '"]').jScrollPane();

        }
    });

    $('.btn-clear').on('click', function () {
        $(this).addClass("jelatin");
        chrome.browserAction.setBadgeText({text: ''});
        chrome.browserAction.setTitle({title: config['title']});
        for (var k = 0; k < config["feeds"].length; k++) {
            if (localStorage[k + "_feed_events_ids"] !== '') {
                localStorage[k + "_feed_ids"] = localStorage[k + "_feed_events_ids"] + ',' + localStorage[k + "_feed_ids"];
                localStorage[k + "_feed_events_ids"] = '';
            }
            $('.news[data-id="' + k + '"] .feed li').removeClass('unread');
        }
        $(this).addClass('none');
        $('.menu li span').remove();
        localStorage['badge_count'] = 0;
    });

    $(".btn-settings").on('click', function () {
        chrome.tabs.create({
            url: "options.html"
        });
    });

    $(document).on("click", ".btn-share", function () {
        $(this).toggleClass("jelatin active");
        $(this).siblings(".share-block").toggle('fast');
    });

    $(document).on("click", ".link", function () {

        var feed_id = $(this).parents('.news').data('id');
        var unread_ids = [];
        var badge_text;
        if (localStorage[feed_id + "_feed_events_ids"] !== '') {
            unread_ids[feed_id] = localStorage[feed_id + "_feed_events_ids"].split(',');
        } else {
            unread_ids[feed_id] = [];
        }
        if (unread_ids[feed_id].indexOf($(this).data('id')) != -1) {
            unread_ids[feed_id].splice(unread_ids[feed_id].indexOf($(this).data('id')), 1);
            badge_text = parseInt(localStorage['badge_count']) - 1;
            localStorage['badge_count'] = badge_text;
            setBadgeCount(badge_text.toString());
        }
        localStorage[feed_id + "_feed_events_ids"] = unread_ids[feed_id].join(',');
        $(this).parent().removeClass("unread");
    });
});

function getWidth() {
    var div = $('#nav'),
        ul = $('ul.menu');
    var divWidth = div.width();
    div.css({overflow: 'hidden'});
    var lastLi = ul.find('li:last-child');
    div.mousemove(function (e) {
        var ulWidth = lastLi[0].offsetLeft + lastLi.outerWidth();
        var left = (e.pageX - div.offset().left) * (ulWidth - divWidth) / divWidth;
        div.scrollLeft(left);
    });
}

function setBadgeCount(count) {
    count = (count == '0') ? '' : count;
    chrome.browserAction.setTitle({title: chrome.i18n.getMessage("badge_text") + count});
    chrome.browserAction.setBadgeBackgroundColor({color: config["badge_color"]});
    chrome.browserAction.setBadgeText({text: count});
}

function cleanText(s) {
    s = s.replace(/<[^<]+?>/g, '');
    s = s.replace(/&#(\d\d*);/g, '');
    return s.replace(/"/g, '&quot;').replace(/^\s*/, '').replace(/\s*$/, '');
}

function setDate(date) {
    var rss_date = new Date(date);
    m = rss_date.getMonth();
    d = rss_date.getDate();
    y = rss_date.getFullYear();
    hours = rss_date.getHours();
    min = rss_date.getMinutes();
    min = (parseInt(min) <= 9) ? ('0' + min) : min;

    var month = chrome.i18n.getMessage("month").split(",");

    var today = new Date();
    tm = today.getMonth() + 1;
    td = today.getDate();
    date = ((d == td) && (month[m] == tm)) ? chrome.i18n.getMessage("today") : d + ' ' + month[m] + ' ' + y;
    rss_date = date + ' ' + hours + ':' + min;
    return rss_date;
}

var feedids = [];
var newfeedids = [];


function getContent(feed_id, feed_url, feed_type, feed_more_button, feed_socials, feed_description, feed_image, feed_image_type) {
    feedids[feed_id] = [];
    newfeedids[feed_id] = [];
    newfeedids[feed_id] = localStorage[feed_id + "_feed_events_ids"] ? localStorage[feed_id + "_feed_events_ids"].split(",") : [];
    $('.news[data-id="' + feed_id + '"] ul').empty();
    $.get(feed_url, function (data) {
        var item = (feed_type == "rss") ? "item" : "entry";
        $(data).find(item).each(function () {
            var item_url, item_pubdate, item_description, item_img;
            if (item == "item") {
                item_url = $(this).find('link').text();
                item_pubdate = $(this).find('pubDate').text();
                item_description = $(this).find('description').text();
            }

            if (item == "entry") {
                item_url = $(this).find('link').attr('href');
                item_pubdate = $(this).find('published').text();
                if (feed_type == "youtube") {
                    item_description = $(this).find('description').text();
                } else {
                    item_description = $(this).find('content').text();
                }
            }

            if (feed_image_type == "description") {
                item_img = $($(this).find('description').text()).find("img").attr("src");
            } else if (feed_image_type == "encoded") {
                item_img = $($(this).find('encoded').text()).find("img").attr("src");
            } else if (feed_image_type == "thumbnail") {
                item_img = $(this).find('thumbnail').attr('url');
            } else {
                item_img = $(this).find('enclosure').attr('url');
            }

            var title = $(this).find('title').text();
            var url = item_url;
            var pubdate = setDate(item_pubdate);
            var description = item_description;
            if (feed_description == "show") {
                description = '<div class="description">' + cleanText(description).substring(0, 160) + '...</div>';
            } else {
                description = '';
            }
            var news_id = CryptoJS.SHA1(url);
            var img = item_img;
            img = (!img) ? "/img/noimage.png" : img;
            if (feed_image == "show") {
                img = '<div class="image"><img src="' + img + '"/></div>';
            } else {
                img = '';
            }
            var read = $.inArray(news_id.toString(), newfeedids[feed_id]) >= 0 ? "class=\"unread\"" : "";
            var more = '';
            more = (feed_more_button == "show") ? '<a href="' + url + '" data-id="' + news_id + '" class="btn btn-more link" target="_blank">' + chrome.i18n.getMessage("more") + '</a>' : more;

            if (feed_socials !== "") {

                var social = feed_socials.split(",");
                var share_link = [];
                share_link["tw"] = '<a href="https://twitter.com/share?url=' + url + '" class="btn btn-twitter" target="_blank"><i class="icon-twitter"></i></a>';
                share_link["fb"] = '<a href="https://www.facebook.com/sharer/sharer.php?u=' + url + '" class="btn btn-facebook" target="_blank"><i class="icon-facebook"></i></a>';
                share_link["gp"] = '<a href="https://plus.google.com/share?url=' + url + '" class="btn btn-gplus" target="_blank"><i class="icon-gplus"></i></a>';
                share_link["vk"] = '<a href="https://vk.com/share.php?url=' + url + '" class="btn btn-vk" target="_blank"><i class="icon-vk"></i></a>';

                var share_inner = '';
                for (var j = 0; j < social.length; j++) {
                    if (share_link[social[j]]) {
                        share_inner += share_link[social[j]];
                    }
                }
                share = '<div class="share-block">' + share_inner + '</div>' +
                '<button class="btn btn-share"><i class="icon-share"></i></button>';
            } else {
                share = '';
            }

            var html;
            html = '<li ' + read + '><a href="' + url + '" data-id="' + news_id + '" target="_blank" class="link">' + img +
            '<div class="title">' + cleanText(title) + '</div>' + description +
            '<div class="time"><i class="icon-clock"></i> ' + pubdate + '</div></a>' +
            '<div class="buttons">' + share + more + '</div>' +
            '</li>';
            $('.news[data-id="' + feed_id + '"] ul').append($(html));
            feedids[feed_id].push(news_id);
        });
        $('.news[data-id="' + feed_id + '"]').jScrollPane();
        localStorage[feed_id + "_feed_ids"] = feedids[feed_id].join(',');
        $('#preloader').addClass('none');
    });
}

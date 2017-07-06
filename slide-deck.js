/**
 * @authors
 * @authors
 * @fileoverview TODO
 */
document.cancelFullScreen = document.webkitCancelFullScreen || document.mozCancelFullScreen;

/**
 * @constructor
 */
function SlideDeck(el) {
    this.curSlide_ = 0;
    this.prevSlide_ = 0;
    this.config_ = null;
    this.container = el || document.querySelector('slides');
    this.slides = [];
    this.controller = null;
    this.getCurrentSlideFromHash_();

    // Call this explicitly. Modernizr.load won't be done until after DOM load.
    this.onDomLoaded_.bind(this)();

}

/**
 * @const
 * @private
 */
SlideDeck.prototype.SLIDE_CLASSES_ = ['far-past', 'past', 'current', 'next', 'far-next'];

/**
 * @const
 * @private
 */
SlideDeck.prototype.CSS_DIR_ = 'theme/css/';

/**
 * @private
 */
SlideDeck.prototype.getCurrentSlideFromHash_ = function() {
    var slideNo = parseInt(document.location.hash.substr(1));
    if (slideNo) {
        this.curSlide_ = slideNo - 1;
    } else {
        this.curSlide_ = 0;
    }
};

/**
 * @param {number} slideNo
 */
SlideDeck.prototype.loadSlide = function(slideNo) {
    if (slideNo) {
        this.curSlide_ = slideNo - 1;
        this.updateSlides_();
    }
};

/**
 * @private
 */
SlideDeck.prototype.onDomLoaded_ = function(e) {
    document.body.classList.add('loaded'); // Add loaded class for templates to use.
    this.slides = this.container.querySelectorAll('slide:not([hidden]):not(.backdrop)');



    // If we're on a smartphone, apply special sauce.
    if (Modernizr.mq('only screen and (max-device-width: 480px)')) {
        // No need for widescreen layout on a phone.
        this.container.classList.remove('layout-widescreen');
    }
    this.loadConfig_(SLIDE_CONFIG);
    this.addEventListeners_();
    this.updateSlides_();

    // Add slide numbers and total slide count metadata to each slide.
    var that = this;
    for (var i = 0, slide; slide = this.slides[i]; ++i) {
        slide.dataset.slideNum = i + 1;
        slide.dataset.totalSlides = this.slides.length;
        slide.addEventListener('click', function(e) {
            if (document.body.classList.contains('overview')) {
                that.loadSlide(this.dataset.slideNum);
                e.preventDefault();
                window.setTimeout(function() {
                    that.toggleOverview();
                }, 500);
            }
        }, false);
    }

    // Note: this needs to come after addEventListeners_(), which adds a
    // 'keydown' listener that this controller relies on.
    // Also, no need to set this up if we're on mobile.
    if (!Modernizr.touch) {
        this.controller = new SlideController(this);
        if (this.controller.isPopup) {
            document.body.classList.add('popup');
        }
    }


//    var xhr;
//
//    xhr = new XMLHttpRequest();
//    xhr.open("GET", "images/brain-2-sources.svg", false);
//    // Following line is just to be on the safe side;
//    // not needed if your server delivers SVG with correct MIME type
//    xhr.overrideMimeType("image/svg+xml");
//    xhr.send("");
//    document.getElementById("brain").appendChild(xhr.responseXML.documentElement);


};





/**
 * @private
 */
SlideDeck.prototype.addEventListeners_ = function() {
    document.addEventListener('keydown', this.onBodyKeyDown_.bind(this), false);
    window.addEventListener('popstate', this.onPopState_.bind(this), false);
};

/**
 * @private
 * @param {Event} e The pop event.
 */
SlideDeck.prototype.onPopState_ = function(e) {
    if (e.state != null) {
        this.curSlide_ = e.state;
        this.updateSlides_(true);
    }
};

/**
 * @param {Event} e
 */
SlideDeck.prototype.onBodyKeyDown_ = function(e) {
    if (/^(input|textarea)$/i.test(e.target.nodeName) ||
        e.target.isContentEditable) {
        return;
    }

    // Forward keydowns to the main slides if we're the popup.
    if (this.controller && this.controller.isPopup) {this.controller.sendMsg({keyCode: e.keyCode});}

    switch (e.keyCode) {
        // Enter
        case 13: if (document.body.classList.contains('overview')) {this.toggleOverview();} break;
        case 39: // right arrow
        case 32: // space
        // PgDn
        case 34: this.nextSlide();e.preventDefault(); break;
        case 37: // left arrow
        case 8: // Backspace
        // PgUp
        case 33: this.prevSlide();e.preventDefault(); break;
        // down arrow
        case 40: this.nextSlide();e.preventDefault(); break;
        // up arrow
        case 38: this.prevSlide();e.preventDefault(); break;
        // H: Toggle code highlighting
        case 72: document.body.classList.toggle('highlight-code'); break;
        // O: Toggle overview
        case 79: this.toggleOverview();break;
        // P
        case 80: if (this.controller && this.controller.isPopup) {document.body.classList.toggle('with-notes');} else if (this.controller && !this.controller.popup) {document.body.classList.toggle('with-notes');} break;
        case 82: //
            // TODO: implement refresh on main slides when popup is refreshed.
            break;
        // ESC: Hide notes and highlighting
        case 27: document.body.classList.remove('with-notes'); document.body.classList.remove('highlight-code'); if (document.body.classList.contains('overview')) {this.toggleOverview();} break;
        case 70: // F: Toggle fullscreen
            // Only respect 'f' on body. Don't want to capture keys from an <input>.
            // Also, ignore browser's fullscreen shortcut (cmd+shift+f) so we don't
            // get trapped in fullscreen!
            if (e.target == document.body && !(e.shiftKey && e.metaKey)) {if (document.mozFullScreen !== undefined && !document.mozFullScreen) {document.body.mozRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);} else if (document.webkitIsFullScreen !== undefined && !document.webkitIsFullScreen) {document.body.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);} else {document.cancelFullScreen();}}
            break;

        case 87: // W: Toggle widescreen
            // Only respect 'w' on body. Don't want to capture keys from an <input>.
            if (e.target == document.body && !(e.shiftKey && e.metaKey)) {this.container.classList.toggle('layout-widescreen');} break;
    }
};

/**
 *
 */
SlideDeck.prototype.focusOverview_ = function() {var overview = document.body.classList.contains('overview'); for (var i = 0, slide; slide = this.slides[i]; i++) {slide.style[Modernizr.prefixed('transform')] = overview ? 'translateZ(-2500px) translate(' + (( i - this.curSlide_ ) * 105) + '%, 0%)' : '';}};

/**
 */
SlideDeck.prototype.toggleOverview = function() {document.body.classList.toggle('overview');this.focusOverview_();};

/**
 * @private
 */
SlideDeck.prototype.loadConfig_ = function(config) {
    if (!config) {return;}
    this.config_ = config;
    var settings = this.config_.settings;
    this.loadTheme_(settings.theme || []);
    if (settings.favIcon) {this.addFavIcon_(settings.favIcon);}

    // Prettyprint. Default to on.
    if (!!!('usePrettify' in settings) || settings.usePrettify) {prettyPrint();}
    if (settings.analytics) {this.loadAnalytics_();}
    if (settings.fonts) {this.addFonts_(settings.fonts);}
    // Builds. Default to on.
    if (!!!('useBuilds' in settings) || settings.useBuilds) {this.makeBuildLists_();}

    if (settings.title) {
        document.title = settings.title.replace(/<br\/?>/, ' ');
        if (settings.eventTitle) {document.title +=  ' - ' + settings.eventTitle;}
        document.querySelector('[data-config-title]').innerHTML = settings.title;
    }
    if (settings.subtitle) {document.querySelector('[data-config-subtitle]').innerHTML = settings.subtitle;}
    if (this.config_.presenters) {
        var presenters = this.config_.presenters;
        var dataConfigContact = document.querySelector('[data-config-contact]');
        var html = [];
        if (presenters.length == 1) {
            var p = presenters[0];
            html = [p.name, p.company].join('<br>');
            var gplus = p.gplus ? '<span>Encore Site</span><a href="' + p.gplus + '">' + p.gplus.replace(/https?:\/\//, '') + '</a>' : '';

            var www = p.www ? '<span>ONE Wiki</span><a href="' + p.www + '">' + p.www.replace(/https?:\/\//, '') + '</a>' : '';

            var github = p.github ? '<span>github</span><a href="' + p.github + '">' + p.github.replace(/https?:\/\//, '') + '</a>' : '';

//            var html2 = [gplus, twitter, www, github].join('<br>');
            var html2 = [gplus, www, github].join('<br>');

            if (dataConfigContact) {dataConfigContact.innerHTML = html2;}
        } else {
            for (var i = 0, p; p = presenters[i]; ++i) {
                html.push(p.name + ' - ' + p.company);
            }
            html = html.join('<br>');
            if (dataConfigContact) {
                dataConfigContact.innerHTML = html;
            }
        }

        var dataConfigPresenter = document.querySelector('[data-config-presenter]');
        if (dataConfigPresenter) {
            dataConfigPresenter.innerHTML = html;
            if (settings.eventTitle) {
                dataConfigPresenter.innerHTML = dataConfigPresenter.innerHTML + '<br>' +
                    settings.eventTitle;
            }
        }
    }

    /* Left/Right tap areas. Default to including. */
    if (!!!('enableSlideAreas' in settings) || settings.enableSlideAreas) {
        var el = document.createElement('div');
        el.classList.add('slide-area');
        el.id = 'prev-slide-area';
        el.addEventListener('click', this.prevSlide.bind(this), false);
        this.container.appendChild(el);

        var el = document.createElement('div');
        el.classList.add('slide-area');
        el.id = 'next-slide-area';
        el.addEventListener('click', this.nextSlide.bind(this), false);
        this.container.appendChild(el);
    }

    if (Modernizr.touch && (!!!('enableTouch' in settings) ||
        settings.enableTouch)) {
        var self = this;
        // Note: this prevents mobile zoom in/out but prevents iOS from doing
        // it's crazy scroll over effect and disaligning the slides.
        window.addEventListener('touchstart', function(e) {e.preventDefault();}, false);}
};

/**
 * @private
 * @param {Array.<string>} fonts
 */
SlideDeck.prototype.addFonts_ = function(fonts) {
    var el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = ('https:' == document.location.protocol ? 'https' : 'http') + '://fonts.googleapis.com/css?family=' + fonts.join('|') + '&v2';
    document.querySelector('head').appendChild(el);
};

/**
 * @private
 */
SlideDeck.prototype.buildNextItem_ = function() {
    var slide = this.slides[this.curSlide_];
    var toBuild = slide.querySelector('.to-build');
    var built = slide.querySelector('.build-current');
    if (built) {built.classList.remove('build-current'); if (built.classList.contains('fade')) {built.classList.add('build-fade');}}

    if (!toBuild) {var items = slide.querySelectorAll('.build-fade'); for (var j = 0, item; item = items[j]; j++) {item.classList.remove('build-fade');} return false;}
    toBuild.classList.remove('to-build');
    toBuild.classList.add('build-current');
    return true;
};

/**
 * @param {boolean=} opt_dontPush
 */
SlideDeck.prototype.prevSlide = function(opt_dontPush) {
    if (this.curSlide_ > 0) {
        var bodyClassList = document.body.classList;
        bodyClassList.remove('highlight-code');

        // Toggle off speaker notes if they're showing when we move backwards on the
        // main slides. If we're the speaker notes popup, leave them up.
        if (this.controller && !this.controller.isPopup) {bodyClassList.remove('with-notes');
        } else if (!this.controller) {bodyClassList.remove('with-notes');}
        this.prevSlide_ = this.curSlide_--;
        this.updateSlides_(opt_dontPush);
    }
};

/**
 * @param {boolean=} opt_dontPush
 */
SlideDeck.prototype.nextSlide = function(opt_dontPush) {
    if (!document.body.classList.contains('overview') && this.buildNextItem_()) {return;}
    if (this.curSlide_ < this.slides.length - 1) {
        var bodyClassList = document.body.classList;
        bodyClassList.remove('highlight-code');

        // Toggle off speaker notes if they're showing when we advanced on the main
        // slides. If we're the speaker notes popup, leave them up.
        if (this.controller && !this.controller.isPopup) {bodyClassList.remove('with-notes');
        } else if (!this.controller) {bodyClassList.remove('with-notes');}
        this.prevSlide_ = this.curSlide_++;
        this.updateSlides_(opt_dontPush);
    }
};

/* Slide events */

/**
 * Triggered when a slide enter/leave event should be dispatched.
 *
 * @param {string} type The type of event to trigger
 *     (e.g. 'slideenter', 'slideleave').
 * @param {number} slideNo The index of the slide that is being left.
 */
SlideDeck.prototype.triggerSlideEvent = function(type, slideNo) {
    var el = this.getSlideEl_(slideNo);
    if (!el) {return;}

    // Call onslideenter/onslideleave if the attribute is defined on this slide.
    var func = el.getAttribute(type);
    if (func) {
        new Function(func).call(el); // TODO: Don't use new Function() :(
    }

    // Dispatch event to listeners setup using addEventListener.
    var evt = document.createEvent('Event');
    evt.initEvent(type, true, true);
    evt.slideNumber = slideNo + 1; // Make it readable

   // console.log(evt.slideNumber);
    evt.slide = el;

    el.dispatchEvent(evt);
};


/**
 * Triggered when a slide has a chart to be animate and an  event should be dispatched.
 *
 * @param {string} id of the svg to animate
 *     (e.g. 'slideenter', 'slideleave').
 * @param {number} slideNo The index of the slide that is being left.
 */
SlideDeck.prototype.triggerChartEvent_ = function(type, slideNo) {
    var chartel = this.getSlideEl_(slideNo);
    var svg = chartel.querySelector('svg');

    if (!chartel) {return;}

    // Call onslideenter/onslideleave if the attribute is defined on this slide.
    //var func = el.getAttribute(type);
    //if (func) {
    //    new Function(func).call(el); // TODO: Don't use new Function() :(
   // }

    // Dispatch event to listeners setup using addEventListener.
    var chartevt = document.createEvent('ChartEvent');
    chartevt.initEvent(type, true, true);
    chartevt.slideNumber = slideNo; // Make it readable

     //console.log(chartevt.slideNumber);
    chartevt.slide = chartel;

    chartel.dispatchEvent(chartevt);
};






/**
 * @private
 */
SlideDeck.prototype.updateSlides_ = function(opt_dontPush) {
    var dontPush = opt_dontPush || false;
    var curSlide = this.curSlide_;


    for (var i = 0; i < this.slides.length; ++i) {
        switch (i) {
            case curSlide - 2:  this.updateSlideClass_(i, 'far-past'); break;
            case curSlide - 1:  this.updateSlideClass_(i, 'past'); break;
            case curSlide:      this.updateSlideClass_(i, 'current'); break;
            case curSlide + 1:  this.updateSlideClass_(i, 'next'); break;
            case curSlide + 2:  this.updateSlideClass_(i, 'far-next'); break;
            default:            this.updateSlideClass_(i); break;
        }
    }




    this.triggerSlideEvent('slideleave', this.prevSlide_);
    this.triggerSlideEvent('slideenter', curSlide);

    // Enable current slide's iframes (needed for page loat at current slide).
    this.enableSlideFrames_(curSlide + 1);



    // Enable current slide's charts (needed for page load at current slide).
    this.enableSlideCharts_(curSlide + 1);

    // Enable current slide's charts (needed for page load at current slide).
    this.enableSlideMiniCharts_(curSlide + 1);

    // No way to tell when all slide transitions + auto builds are done.
    // Give ourselves a good buffer to preload the next slide's iframes.
    window.setTimeout(this.enableSlideFrames_.bind(this, curSlide + 2), 1000);
    this.updateHash_(dontPush);
    if (document.body.classList.contains('overview')) {this.focusOverview_();return;}
};



/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.enableSlideMiniCharts_ = function(slideNo) {
    var el = this.slides[slideNo - 1];
    if (!el) {return;}
    var svgs = el.querySelectorAll('.chartcontainermini svg');
    for (var i = 0, svg; svg = svgs[i]; i++) {this.enableMiniChart_(svg);}

};



/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.enableSlideCharts_ = function(slideNo) {
    var el = this.slides[slideNo - 1];
    if (!el) {return;}
    var svgs = el.querySelectorAll('.chartcontainer svg');
    for (var i = 0, svg; svg = svgs[i]; i++) {this.enableChart_(svg);}

};



/**
 * @private
 * @param {string} svg
 */
SlideDeck.prototype.enableChart_ = function(svg) {

    var chart = svg,
        width,
        height;

//    if(document.body.chart.classList.contains('mini')) {
//        width = 40;
//    }
//    else width = 960

    var margin = {top: 20, right: 30, bottom: 60, left: 70},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var y = d3.scale.linear().range([height, 0]);
    var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    var svgchart = d3.select("#" + chart.id)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        //.on("mouseenter", function () {drawChart();})
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("data/" + chart.id + ".csv", type, function(error, data) {
        x.domain(data.map(function(d) { return d.a; }));
        y.domain([0, d3.max(data, function(d) { return d.b; })]);

        svgchart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {return "rotate(-65)"});

        svgchart.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        svgchart.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("opacity",0)
            .attr("x", function(d) { return x(d.a); })
            .attr("width", x.rangeBand())
            .transition()
            .ease("linear")
            .attr("y", height)
            .attr("height", 0)
            .each("end", function () {drawChart();});
    });
    function drawChart() {
        svgchart.selectAll(".bar")
            .transition()
            .ease("bounce")
            .attr("opacity",1)
            .styleTween("fill", function(d) { return d3.interpolate("#8d44ac", "#297fb8"); })
            .attr("height", function(d) { return height - y(d.b); })
            .attr("y", function(d) { return y(d.b); })
            .duration(2000);
    }
    function type(d) {d.b = +d.b; return d;}

};



/**
 * @private
 * @param {string} svg
 */
SlideDeck.prototype.enableMiniChart_ = function(svg) {

    var chart = svg,
        width,
        height;

//    if(document.body.chart.classList.contains('mini')) {
//        width = 40;
//    }
//    else width = 960

    var margin = {top: 20, right: 30, bottom: 60, left: 70},
        width = 480 - margin.left - margin.right,
        height = 250 - margin.top - margin.bottom;
    var y = d3.scale.linear().range([height, 0]);
    var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    var svgchart = d3.select("#" + chart.id)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        //.on("mouseenter", function () {drawChart();})
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    d3.csv("data/" + chart.id + ".csv", type, function(error, data) {
        x.domain(data.map(function(d) { return d.a; }));
        y.domain([0, d3.max(data, function(d) { return d.b; })]);

        svgchart.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis)
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", function(d) {return "rotate(-65)"});

        svgchart.append("g")
            .attr("class", "y axis")
            .call(yAxis);

        svgchart.selectAll(".bar")
            .data(data)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("opacity",0)
            .attr("x", function(d) { return x(d.a); })
            .attr("width", x.rangeBand())
            .transition()
                .ease("linear")
                .attr("y", height)
                .attr("height", 0)
                .each("end", function () {drawChart();});
    });
    function drawChart() {
        svgchart.selectAll(".bar")
            .transition()
            .ease("bounce")
            .attr("opacity",1)
            .styleTween("fill", function(d) { return d3.interpolate("#8d44ac", "#297fb8"); })
            .attr("height", function(d) { return height - y(d.b); })
            .attr("y", function(d) { return y(d.b); })
            .duration(1500);
    }
    function type(d) {d.b = +d.b; return d;}

};








/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.enableSlideFrames_ = function(slideNo) {
    var el = this.slides[slideNo - 1];
    if (!el) {return;}
    var frames = el.querySelectorAll('iframe');
    for (var i = 0, frame; frame = frames[i]; i++) {this.enableFrame_(frame);}
};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.enableFrame_ = function(frame) {var src = frame.dataset.src;if (src && frame.src != src) {frame.src = src;}};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.disableSlideFrames_ = function(slideNo) {
    var el = this.slides[slideNo - 1];
    if (!el) {return;}
    var frames = el.querySelectorAll('iframe');
    for (var i = 0, frame; frame = frames[i]; i++) {this.disableFrame_(frame);}
};

/**
 * @private
 * @param {Node} frame
 */
SlideDeck.prototype.disableFrame_ = function(frame) {frame.src = 'about:blank';};

/**
 * @private
 * @param {number} slideNo
 */
SlideDeck.prototype.getSlideEl_ = function(no) {
    if ((no < 0) || (no >= this.slides.length)) {
        return null;
    } else {
        return this.slides[no];
    }};

/**
 * @private
 * @param {number} slideNo
 * @param {string} className
 */
SlideDeck.prototype.updateSlideClass_ = function(slideNo, className) {
    var el = this.getSlideEl_(slideNo);
    if (!el) {return;}
    if (className) {el.classList.add(className);}
    for (var i = 0, slideClass; slideClass = this.SLIDE_CLASSES_[i]; ++i) {if (className != slideClass) {el.classList.remove(slideClass);}}
};

/**
 * @private
 */
SlideDeck.prototype.makeBuildLists_ = function () {
    for (var i = this.curSlide_, slide; slide = this.slides[i]; ++i) {
        var items = slide.querySelectorAll('.build > *');
        for (var j = 0, item; item = items[j]; ++j) {
            if (item.classList) {
                item.classList.add('to-build');
                if (item.parentNode.classList.contains('fade')) {item.classList.add('fade');}
            }
        }
    }
};

/**
 * @private
 * @param {boolean} dontPush
 */
SlideDeck.prototype.updateHash_ = function(dontPush) {
    if (!dontPush) {
        var slideNo = this.curSlide_ + 1;
        var hash = '#' + slideNo;
        if (window.history.pushState) {window.history.pushState(this.curSlide_, 'Slide ' + slideNo, hash);} else {window.location.replace(hash);}
    }
};

/**
 * @private
 * @param {string} favIcon
 */
SlideDeck.prototype.addFavIcon_ = function(favIcon) {
    var el = document.createElement('link');
    el.rel = 'icon';
    el.type = 'image/png';
    el.href = favIcon;
    document.querySelector('head').appendChild(el);
};

/**
 * @private
 * @param {string} theme
 */
SlideDeck.prototype.loadTheme_ = function(theme) {
    var styles = [];
    if (theme.constructor.name === 'String') {styles.push(theme);
    } else {styles = theme;}

    for (var i = 0, style; themeUrl = styles[i]; i++) {
        var style = document.createElement('link');
        style.rel = 'stylesheet';
        style.type = 'text/css';
        if (themeUrl.indexOf('http') == -1) {style.href = this.CSS_DIR_ + themeUrl + '.css';
        } else {style.href = themeUrl;}
        document.querySelector('head').appendChild(style);
    }
};

// Polyfill missing APIs (if we need to), then create the slide deck.
// iOS < 5 needs classList, dataset, & window.matchMedia. Modernizr has the last.
(function() {

    Modernizr.load({
        test: !!document.body.classList && !!document.body.dataset,
        nope: ['js/polyfills/classList.min.js', 'js/polyfills/dataset.min.js'],
        complete: function() {window.slidedeck = new SlideDeck();}
    });
})();


(function() {})();


///**
// *
// * Activator Chart
// */
//(function() {
//    var margin = {top: 20, right: 30, bottom: 30, left: 60}, width = 960 - margin.left - margin.right, height = 500 - margin.top - margin.bottom;
//    var y = d3.scale.linear().range([height, 0]);
//    var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
//    var xAxis = d3.svg.axis().scale(x).orient("bottom");
//    var yAxis = d3.svg.axis().scale(y).orient("left");
//
//    var chart = d3.select("#activator")
//        .attr("width", width + margin.left + margin.right)
//        .attr("height", height + margin.top + margin.bottom)
//        .on("mouseenter", function () {drawChart();})
//        .append("g")
//        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
//    d3.csv("data/activator.csv", type, function(error, data) {
//        x.domain(data.map(function(d) { return d.year; }));
//        y.domain([0, d3.max(data, function(d) { return d.rules; })]);
//
//        chart.append("g")
//            .attr("class", "x axis")
//            .attr("transform", "translate(0," + height + ")")
//            .call(xAxis);
//
//        chart.append("g")
//            .attr("class", "y axis")
//            .call(yAxis)
//            .append("text")
//            .attr("y", 6)
//            .attr("x", 20)
//            .attr("dy", ".71em")
//            .style("text-anchor", "start")
//            .text("Activator Rules Growth - All Manual");
//
//        chart.append("g")
//            .attr("transform", "translate(0," + height + ")")
//            .attr("class", "foo");
//
//        chart.selectAll(".bar")
//            .data(data)
//            .enter().append("rect")
//            .attr("class", "bar")
//            .attr("height", 0)
//            .attr("opacity",0)
//            .attr("x", function(d) { return x(d.year); })
//            .attr("width", x.rangeBand())
//            .attr("y", height);
//
//    });
//
//    function drawChart() {
//        chart.selectAll(".bar")
//            .transition()
//            .ease("bounce")
//            .attr("opacity",1)
//            .attr("height", function(d) { return height - y(d.rules); })
//            .attr("y", function(d) { return y(d.rules); })
//            .duration(2000);
//    }
//    function type(d) {d.rules = +d.rules; return d;}
//})();
//
///**
// *
// * Queues Chart
// */
//(function() {
//
//    var margin = {top: 20, right: 30, bottom: 30, left: 60}, width = 960 - margin.left - margin.right, height = 500 - margin.top - margin.bottom;
//    var y = d3.scale.linear().range([height, 0]);
//    var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
//    var xAxis = d3.svg.axis().scale(x).orient("bottom");
//    var yAxis = d3.svg.axis().scale(y).orient("left");
//
//    var chart = d3.select("#queues")
//        .attr("width", width + margin.left + margin.right)
//        .attr("height", height + margin.top + margin.bottom)
//        .on("mouseenter", function () {drawChart();})
//        .append("g")
//        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
//    d3.csv("data/queues.csv", type, function(error, data) {
//        x.domain(data.map(function(d) { return d.year; }));
//        y.domain([0, d3.max(data, function(d) { return d.queues; })]);
//
//        chart.append("g")
//            .attr("class", "x axis")
//            .attr("transform", "translate(0," + height + ")")
//            .call(xAxis);
//
//        chart.append("g")
//            .attr("class", "y axis")
//            .call(yAxis)
//            .append("text")
//            .attr("y", 6)
//            .attr("x", 20)
//            .attr("dy", ".71em")
//            .style("text-anchor", "start")
//            .text("Queues Growth - All Manual");
//
//        chart.append("g").attr("transform", "translate(0," + height + ")").attr("class", "foo");
//
//        chart.selectAll(".bar")
//            .data(data)
//            .enter().append("rect")
//            .attr("class", "bar")
//            .attr("opacity",0)
//            .attr("x", function(d) { return x(d.year); })
//            .attr("y", height)
//            .attr("height", 0)
//            .attr("width", x.rangeBand());
//    });
//    function drawChart() {
//        chart.selectAll(".bar")
//            .transition()
//            .ease("bounce")
//            .attr("opacity",1)
//            .attr("y", function(d) { return y(d.queues); })
//            .attr("height", function(d) { return height - y(d.queues); })
//            .duration(2000);
//    }
//    function type(d) {d.queues = +d.queues; return d;}
//})();
//
///**
// *
// * Queueviews Chart
// */
//(function() {
//
//    var margin = {top: 10, right: 30, bottom: 30, left: 90}, width = 960 - margin.left - margin.right, height = 500 - margin.top - margin.bottom;
//    var y = d3.scale.linear().range([height, 0]);
//    var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
//    var xAxis = d3.svg.axis().scale(x).orient("bottom");
//    var yAxis = d3.svg.axis().scale(y).orient("left");
//
//    var chart = d3.select("#queueviews")
//        .attr("width", width + margin.left + margin.right)
//        .attr("height", height + margin.top + margin.bottom)
//        .on("mouseenter", function () {drawChart();})
//        .append("g")
//        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
//    d3.csv("data/queueviews.csv", type, function(error, data) {
//        x.domain(data.map(function(d) { return d.year; }));
//        y.domain([0, d3.max(data, function(d) { return d.queueviews; })]);
//
//        chart.append("g")
//            .attr("class", "x axis")
//            .attr("transform", "translate(0," + height + ")")
//            .call(xAxis);
//
//        chart.append("g")
//            .attr("class", "y axis")
//            .call(yAxis)
//            .append("text")
//            .attr("y", 6)
//            .attr("x", 20)
//            .attr("dy", ".71em")
//            .style("text-anchor", "start")
//            .text("QueueViews Growth - All Manual");
//
//        chart.append("g")
//            .attr("transform", "translate(0," + height + ")")
//            .attr("class", "foo");
//
//        chart.selectAll(".bar")
//            .data(data)
//            .enter().append("rect")
//            .attr("class", "bar")
//            .attr("x", function(d) { return x(d.year); })
//            .attr("y", height)
//            .attr("opacity",0)
//            .attr("height", 0)
//            .attr("width", x.rangeBand());
//    });
//
//    function drawChart() {
//        chart.selectAll(".bar")
//            .transition()
//            .ease("bounce")
//            .attr("opacity",1)
//            .attr("y", function(d) { return y(d.queueviews); })
//            .attr("height", function(d) { return height - y(d.queueviews); })
//            .duration(2000);
//    }
//    function type(d) {d.queueviews = +d.queueviews;return d;}
//})();
//
///**
// * SKU / Product / Offerings
// */
//(function() {
//
//    var margin = {top: 0, right: 20, bottom: 30, left: 80},width = 960 - margin.left - margin.right,height = 500 - margin.top - margin.bottom;
//    var x0 = d3.scale.ordinal().rangeRoundBands([0, width], .1);
//    var x1 = d3.scale.ordinal();
//    var y = d3.scale.linear().range([height, 0]);
//    var color = d3.scale.ordinal().range(["#169f84","#297fb8", "#27ad60"]);
//    var xAxis = d3.svg.axis().scale(x0).orient("bottom");
//    var yAxis = d3.svg.axis().scale(y).orient("left").tickFormat(d3.format(".1s"));
//
//
//    var chart = d3.select("#skus")
//        .attr("width", width + margin.left + margin.right)
//        .attr("height", height + margin.top + margin.bottom)
//        .on("mouseenter", function () {drawChart();})
//        .append("g")
//        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
//    d3.csv("data/skuniverse.csv", function(error, data) {
//        var catNames = d3.keys(data[0]).filter(function(key) { return key !== "year"; });
//
//        data.forEach(function(d) {d.cats = catNames.map(function(name) { return {name: name, value: +d[name]}; });});
//        x0.domain(data.map(function(d) { return d.year; }));
//        x1.domain(catNames).rangeRoundBands([0, x0.rangeBand()]);
//        y.domain([0, d3.max(data, function(d) { return d3.max(d.cats, function(d) { return d.value; }); })]);
//        chart.append("g")
//            .attr("class", "x axis")
//            .attr("transform", "translate(0," + height + ")")
//            .call(xAxis);
//
//        chart.append("text")
//            .attr("y", 20)
//            .attr("dy", ".71em")
//            .attr("x", 20)
//            .style("font-size", "24px")
//            .style("text-anchor", "start")
//            .text("Growth in Platforms / Offerings / SKUs");
//
//        chart.append("g")
//            .attr("class", "y axis")
//            .call(yAxis);
//
//        var state = chart.selectAll(".state")
//            .data(data)
//            .enter().append("g")
//            .attr("class", "g")
//            .attr("transform", function(d) { return "translate(" + x0(d.year) + ",0)"; });
//
//        state.selectAll("rect")
//            .data(function(d) { return d.cats; })
//            .enter()
//            .append("rect")
//                .attr("class", "bar")
//                .attr("width", x1.rangeBand())
//                .attr("x", function(d) { return x1(d.name); })
//                .attr("y", height)
//                .attr("height", 0)
//                .attr("opacity",0)
//                .style("fill", function(d) { return color(d.name); });
//
//        var legend = chart.selectAll(".legend")
//            .data(catNames)
//            .enter().append("g")
//            .attr("class", "legend")
//            .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
//
//        legend.append("rect")
//            .attr("x", width - 150)
//            .attr("width", 40)
//            .attr("height", 20)
//            .style("fill", color);
//
//        legend.append("text")
//            .attr("x", width - 170)
//            .attr("y", 9)
//            .attr("dy", ".35em")
//            .style("text-anchor", "end")
//            .text(function(d) { return d; });
//
//    });
//
//    function drawChart() {
//        chart.selectAll(".bar")
//            .transition()
//            .ease("bounce")
//            .attr("opacity",1)
//            .attr("y", function(d) { return y(d.value); })
//            .attr("height", function(d) { return height - y(d.value); })
//            .duration(2000);
//    }
//
//})();
//
//
///**
// * Core Ticket Counts
// */
//(function() {
//    var margin = {top: 20,right: 30,bottom: 60,left: 60}, width = 960 - margin.left - margin.right,height = 500 - margin.top - margin.bottom;
//    var y = d3.scale.linear().range([height, 0]);
//    var x = d3.scale.ordinal().rangeRoundBands([0, width], .1);
//    var xAxis = d3.svg.axis().scale(x).orient("bottom");
//    var yAxis = d3.svg.axis().scale(y).orient("left");
//    var chart = d3.select("#coretickets")
//        .attr("width", width + margin.left + margin.right)
//        .attr("height", height + margin.top + margin.bottom)
//        .on("mouseenter", function () {drawChart();})
//        .append("g")
//        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//    d3.csv("data/coretickets.csv", type, function(error, data) {
//        x.domain(data.map(function(d) { return d.Month; }));
//        y.domain([0, d3.max(data, function(d) { return d.Tickets; })]);
//        chart.append("g")
//            .attr("class", "x axis")
//            .attr("transform", "translate(0," + height + ")")
//            .call(xAxis)
//            .selectAll("text")
//            .style("text-anchor", "end")
//            .attr("dx", "-.8em")
//            .attr("dy", ".15em")
//            .attr("transform", function(d) {return "rotate(-65)"});
//
//        chart.append("g")
//            .attr("class", "y axis")
//            .call(yAxis)
//            .append("text")
//            .attr("y", 6)
//            .attr("x", 20)
//            .attr("dy", ".71em")
//            .style("text-anchor", "start")
//            .text("Dedicated Ticket Growth")
//            .style("font-size", "24px");
//
//        chart.selectAll(".bar")
//            .data(data)
//            .enter().append("rect")
//            .attr("class", "bar")
//            .attr("opacity",0)
//            .attr("x", function(d) { return x(d.Month); })
//            .attr("y", height)
//            .attr("height", 0)
//            .attr("width", x.rangeBand());
//    });
//    function drawChart() {
//        chart.selectAll(".bar")
//            .transition()
//            .ease("bounce")
//            .attr("opacity",1)
//            .attr("y", function(d) { return y(d.Tickets); })
//            .attr("height", function(d) { return height - y(d.Tickets); })
//            .duration(2000);
//    }
//    function type(d) {d.Tickets = +d.Tickets;return d;}
//})();
//
//
///**
// * ZenDesk Ticket Counts
// */
//(function() {
//
//    var margin = {top: 0,right: 0,bottom: 60,left: 60}, width = 960 - margin.left - margin.right, height = 500 - margin.top - margin.bottom;
//    var y       = d3.scale.linear().range([height, 0]);
//    var x       = d3.scale.ordinal().rangeRoundBands([0, width], .1);
//    var xAxis   = d3.svg.axis().scale(x).orient("bottom");
//    var yAxis   = d3.svg.axis().scale(y).orient("left");
//
//    var chart = d3.select("#zdtickets")
//        .attr("width", width + margin.left + margin.right)
//        .attr("height", height + margin.top + margin.bottom)
//        .on("mouseenter", function () {drawChart();})
//        .append("g")
//        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
//    d3.csv("data/zdtickets.csv", type, function(error, data) {
//        x.domain(data.map(function(d) { return d.Month; }));
//        y.domain([0, d3.max(data, function(d) { return d.Tickets; })]);
//
//        chart.append("g")
//            .attr("class", "x axis")
//            .attr("transform", "translate(0," + height + ")")
//            .call(xAxis)
//            .selectAll("text")
//            .style("text-anchor", "end")
//            .attr("dx", "-.8em")
//            .attr("dy", ".15em")
//            .attr("transform", function(d) {return "rotate(-65)"});
//
//        chart.append("g")
//            .attr("class", "y axis")
//            .call(yAxis)
//            .append("text")
//            .attr("y", 6)
//            .attr("x", 20)
//            .attr("dy", ".71em")
//            .style("text-anchor", "start")
//            .text("ZenDesk Ticket Growth")
//            .style("font-size", "24px");
//
//        chart.selectAll(".bar")
//            .data(data)
//            .enter().append("rect")
//            .attr("class", "bar")
//            .attr("opacity",0)
//            .attr("x", function(d) {return x(d.Month); })
//            .attr("height", 0)
//            .attr("y", height)
//            .attr("width", x.rangeBand());
//    });
//
//    function drawChart() {
//        chart.selectAll(".bar")
//            .transition()
//            .ease("bounce")
//            .attr("opacity",1)
//            .attr("y", function(d) { return y(d.Tickets); })
//            .attr("height", function(d) { return height - y(d.Tickets); })
//            .duration(2000);
//    }
//    function type(d) {d.Tickets = +d.Tickets; return d;}
//})();
//
//
///**
// * Ticket Resolution Times
// */
//(function() {
//
//    var margin = {top: 20,right: 30,bottom: 60,left: 60}, width = 960 - margin.left - margin.right, height = 500 - margin.top - margin.bottom;
//    var y       = d3.scale.linear().range([height, 0]);
//    var x       = d3.scale.ordinal().rangeRoundBands([0, width], .1);
//    var xAxis   = d3.svg.axis().scale(x).orient("bottom");
//    var yAxis   = d3.svg.axis().scale(y).orient("left");
//
//    var chart = d3.select("#ticketresolution")
//        .attr("width", width + margin.left + margin.right)
//        .attr("height", height + margin.top + margin.bottom)
//        .on("mouseenter", function () {drawChart();})
//        .append("g")
//        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
//
//    var iamslide = document.querySelector('#ticketresolutionslide.current');
//
//    //iamslide.addEventListener("click", function () {drawChart();});
//    //iamslide.addEventListener('focus', function () {drawChart();});
//    //iamslide.addEventListener('show', function () {drawChart();});
//
//
//
//    d3.csv("data/ticketresolution.csv", type, function(error, data) {
//        x.domain(data.map(function(d) { return d.Month; }));
//        y.domain([0, d3.max(data, function(d) { return d.Time; })]);
//
//        chart.append("g")
//            .attr("class", "x axis")
//            .attr("transform", "translate(0," + height + ")")
//            .call(xAxis)
//            .selectAll("text")
//            .style("text-anchor", "end")
//            .attr("dx", "-.8em")
//            .attr("dy", ".15em")
//            .style('font-size', '45%')
//            .attr("transform", function(d) {return "rotate(-65)"});
//
//        chart.append("g")
//            .attr("class", "y axis")
//            .call(yAxis)
//            .append("text")
//            .attr("y", 6)
//            .attr("x", 20)
//            .attr("dy", ".71em")
//            .style("text-anchor", "start")
//            .text("Ticket Resolution Time")
//            .style("font-size", "18px");
//
//        chart.selectAll(".bar")
//            .data(data)
//            .enter().append("rect")
//            .attr("class", "bar")
//            .attr("opacity", 0)
//            .attr("x", function(d) { return x(d.Month); })
//            .attr("y", height )
//            .attr("height", "0" )
//            .attr("width", x.rangeBand())
//            .on("end", function () {drawChart();});
//    });
//    function drawChart() {
//        chart.selectAll(".bar")
//            .transition()
//            .ease("bounce")
//            .attr("opacity",1)
//            .attr("y", function(d) { return y(d.Time); })
//            .attr("height", function(d) { return height - y(d.Time); })
//            .duration(2000);
//    }
//
//    function type(d) {d.Time = +d.Time; return d;}
//})();
//
//


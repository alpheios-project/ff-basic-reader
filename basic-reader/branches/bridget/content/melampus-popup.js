/*
 * Mouseover translation functions
 */

// make sure the MP namespace is defined
if (typeof MP == "undefined") 
{
    MP = {};
}

MP.xlate = {
    s_lastWord: "",

    xsltProcessor: null,
   
    transform: function(text) 
    {
        /* initialze the xsltProcessor if we haven't done so already */
        if (this.xsltProcessor == null) 
        {
            /* TODO Revisit this. Probably ought to read directly from the
             * filesystem rather than loading via an ajax request to the chrome
             */
            this.xsltProcessor = new XSLTProcessor();
            var p = new XMLHttpRequest();
            p.open("GET", "chrome://melampus/skin/melampus.xsl", false);
            p.send(null);
            var xslRef = p.responseXML;
            this.xsltProcessor.importStylesheet(xslRef)
        }
        var wordHTML = '';
        try 
        {

            var wordXML = (new DOMParser()).parseFromString(text,"text/xml");
            wordHTML = this.xsltProcessor.transformToDocument(wordXML);
        } 
        catch (e) 
        {
            MP.util.log(e);
        }
        return wordHTML;
    },

    doMouseMoveOverText: function(a_e)
    {
        if (!a_e)
            a_e = window.event;

        var rp = a_e.rangeParent;
        var ro = a_e.rangeOffset;

        // if no data, nothing to do
        if (typeof rp == "undefined" || ! rp.data) 
        {
            return;
        }

        /* The rangeParent is going to be a #text node.
         * Get the parentNode of the text node for use in traversing
         * for the context if the node contains only a single word.
         */
        //
        var rp_parent = rp.parentNode;

        var range = document.createRange();
        range.selectNode(rp);
        var rngstr = range.toString();
        /* detachs the range from the parent document so that DOM no longer tracks it */
        range.detach();

        //identify the target of the user's selection
        var target = MP.main.getLanguageTools().findSelection(ro,rngstr);
        
        
        // if we couldn't identify the target word, just return without doing
        // anything more
        if (typeof target.word == "undefined") {
            return;
        }
        
        // nothing to do if same word as last, AND the popup is shown
        // TODO this should really check whether the entire calculated 
        // target is the same as the last target, rather than just the word
        // because in some languages repeated words may have a different sense
        // or meaning 
        if (target.word == this.s_lastWord && 
            $("#mp-window",window.content.document).is(':visible')) 
        {
            return;
        }

        this.s_lastWord = target.word;

        // Add the range back to the document highlighted as the selected range
        var doc = rp.ownerDocument;
        var r = doc.createRange();
        r.setStart(rp, target.wordStart);
        r.setEnd(rp, target.wordEnd);
        var sel = doc.defaultView.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);

        // add the range parent object to the target
        // so that the user's selection can be highlighted
        // again differently after translation, if necessary
        
        target.rp = rp;
        
        // show output
        this.showPopup(
            a_e.target, 
            a_e.screenX, 
            a_e.screenY,
            target);
    },

    ajaxError: function (req, textStatus, errorThrown) 
    {
        const topdoc = content.document;
        var err_msg = 
            document
                .getElementById("melampus-strings")
                .getFormattedString(
                    "mp-loading-error",
                    [errorThrown || textStatus]);
        MP.util.log("Query Response (Error): " + err_msg);
        
        $("#mp-text-loading",topdoc).remove();
        
        $("#mp-text",topdoc).append(
            '<div id="mp-loading-error">' + 
            err_msg + 
            '</div>'
        );

        
    },

    showTranslation: function(a_html, a_target) {
        MP.util.log("Query response:" + a_html);
        const topdoc = content.document;
        var wordHTML = MP.xlate.transform(a_html);
        // don't display an empty popup
        if (   (wordHTML == '')
            || (   ($(".mp-entry",wordHTML).size() == 0)
                && ($(".mp-unknown",wordHTML).size() == 0)
                && ($(".mp-error",wordHTML).size() == 0)))
        {
            MP.util.log("No valid entries to display.");
            return MP.xlate.hidePopup(topdoc);

        }
        $("#mp-text",topdoc).remove();
        var mptext_node = topdoc.importNode(wordHTML.getElementById("mp-text"),true);
        $("#mp-window",topdoc).append(mptext_node);

        // add a language-specific click handler if desired
        MP.main.getLanguageTools().contextClick(topdoc);
        
        // re-highlight the translated range in the source document
        var doc = a_target.rp.ownerDocument;
        var r = doc.createRange();
        r.setStart(a_target.rp, a_target.wordStart);
        r.setEnd(a_target.rp, a_target.wordEnd);
        var sel = doc.defaultView.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
    },
    
    showPopup: function(a_elem, a_x, a_y, a_target)
    {
        const topdoc = content.document;
        var popup = topdoc.getElementById("mp-window");
        if (!popup)
        {
            var css = topdoc.createElementNS("http://www.w3.org/1999/xhtml",
                                             "link");
            css.setAttribute("rel", "stylesheet");
            css.setAttribute("type", "text/css");
            css.setAttribute("href", "chrome://melampus/skin/melampus.css");
            css.setAttribute("id", "melampus-css");
            topdoc.getElementsByTagName("head")[0].appendChild(css);

            popup = topdoc.createElementNS("http://www.w3.org/1999/xhtml", "div");
            popup.setAttribute("id", "mp-window");

            /* cancel the mousemove and dblclick events over the popup */
            popup.addEventListener("mousemove", this.cancelMouseMove, false);
            popup.addEventListener("dblclick", this.cancelDoubleClick, false);
            topdoc.body.appendChild(popup);
            // add a close link if the popup is activated by a double-click
            // instead of mouseover
            if (MP.main.getTrigger() == 'dblclick') 
            {
                close_link = 
                   topdoc.createElementNS("http://www.w3.org/1999/xhtml",
                                        "div");
                close_link.setAttribute("id","mp-close");
                close_link.innerHTML = "[x]";
                popup.appendChild(close_link);
                $("#mp-close",topdoc).bind("click", 
                    function() 
                    { 
                        MP.xlate.hidePopup(topdoc)
                    }
                );
            }

        }
        
        popup.style.width = "auto";
        popup.style.height = "auto";
        
        // TODO should this be a config option?
        popup.style.maxWidth = "600px";
        
        /* reset the contents of the popup */
        // TODO - just add a background loading if the popup has contents?
        
        var xlate_loading = 
            document
                .getElementById("melampus-strings")
                .getFormattedString("mp-loading-translation",[a_target.word]);
        $("#mp-text",topdoc).remove();
        $("#mp-window",topdoc).append(
            '<div id="mp-text"><div id="mp-text-loading">' + 
            xlate_loading + 
            '</div></div>'
        );
        
        if (a_elem)
        {
            popup.style.top = "-1000px";
            popup.style.left = "0px";
            popup.style.display = "";

            var pW = popup.offsetWidth;
            var pH = popup.offsetHeight;

            // we may need to just guess!
            if (pW <= 0)
                pW = 200;
            if (pH <= 0)
            {
                pH = 0;
                var j = 0;
                while ((j = a_text.indexOf("<br/>", j)) != -1)
                {
                    j += 5;
                    pH += 22;
                }
                pH += 25;
            }

            // these things are always on top, so go sideways
            if (a_elem instanceof Components.interfaces.nsIDOMHTMLOptionElement)
            {
                // find the position relative to top-most window
                a_x = 0;
                a_y = 0;

                var e = a_elem;
                while (e)
                {
                    a_x += e.offsetLeft;
                    a_y += e.offsetTop;
                    if (e.offsetParent)
                    {
                        e = e.offsetParent;
                    }
                    else
                    {
                        e = e.ownerDocument;
                        if ((!e) ||
                            (!e.defaultView) ||
                            (!e.defaultView.frameElement))
                        {
                           break;
                        }
                        e = e.defaultView.frameElement;
                    }
                }

                // need another loop since elements like scrollable DIVs
                // (any others?) are probably not in the path of offsetParent
                const mainBody = window.content.document.body;
                e = a_elem;
                while (e)
                {
                    if (e.scrollTop != null)
                    {
                        a_x -= e.scrollLeft;
                        a_y -= e.scrollTop;
                    }
                    if (e.parentNode)
                    {
                        e = e.parentNode;
                        if (e == mainBody)
                            break;
                    }
                    else
                    {
                        if ((!e.defaultView) || (!e.defaultView.frameElement))
                            break;
                        e = e.defaultView.frameElement;
                    }
                }

                if (a_x > (content.innerWidth - (a_x + a_elem.offsetWidth)))
                {
                    a_x = (a_x - popup.offsetWidth - 5);
                    if (a_x < 0)
                        a_x = 0;
                }
                else
                {
                    a_x += a_elem.offsetWidth + 5;
                }
            }
            else
            {
                const bbo = gBrowser.mCurrentBrowser.boxObject;

                a_x -= bbo.screenX;
                a_y -= bbo.screenY;

                // go left if necessary
                if ((a_x + pW) > (content.innerWidth - 15))
                {
                    a_x = (content.innerWidth - pW) - 15;
                    if (a_x < 0)
                        a_x = 0;
                }

                // below the mouse
                var v = 20;

                // under the popup title
                if ((a_elem.title) && (a_elem.title != ""))
                    v += 20;

                // go up if necessary
                if ((a_y + v + pH) > content.innerHeight)
                {
                    var t = a_y - pH - 20;
                    if (t >= 0)
                        a_y = t;
                }
                else
                    a_y += v;

                a_x += content.scrollX;
                a_y += content.scrollY;
            }
        }
        else
        {
            a_x += content.scrollX;
            a_y += content.scrollY;
        }

        popup.style.left = a_x + "px";
        popup.style.top = a_y + "px";
        popup.style.display = "";

        // add the original word to the browser's melampus object so that the
        // other functions can access it
        MP.main.getCurrentBrowser().melampus.word = a_target.word;
        
        // now translate the word - when the ajax call returns
        // the popup will be refreshed with the results
        MP.main.getLanguageTools()
            .translateWord(
                a_target,
                function(data){MP.xlate.showTranslation(data,a_target)}
            );
    },

    hidePopup: function(topdoc)
    {
        $("#mp-window",topdoc).css("display","none");    
        $("#mp-text",topdoc).remove();

    },

    cancelMouseMove: function(e)
    {
        e.stopPropagation();
    },
    
    cancelDoubleClick: function(e) 
    {
        e.stopPropagation();
    },

    grammarClickHandler: function(a_e) 
    {
        var rp = a_e.rangeParent;
        var ro = a_e.rangeOffset;
        var range = document.createRange();
        range.selectNode(rp);
                

        // get class and context from containing span
        var attrs = range.startContainer.attributes;
        var rngClass = null;
        var rngContext = null;
        for (var i = 0; i < attrs.length; ++i)
        {
            if (attrs[i].name == "class")
            {
                rngClass = attrs[i].value;
            }
            if (attrs[i].name == "context")
            {
                rngContext = attrs[i].value;
            }
        }

        // if this is one of the classes we want to handle
        if (   (rngClass == "mp-decl")
            || (rngClass == "mp-conj")
            || (rngClass == "mp-pofs")
            || (rngClass == "mp-mood")
            || (rngClass == "mp-case"))
        {
            // build target inside grammar
            var target = rngClass;
            if (rngContext != null)
            {
                 target += "-" + rngContext.split(/-/)[0];
            }
            //TODO - this url must be language specific
            var targetURL = MP.util.getPref("url.grammar");
            targetURL = targetURL.replace(/\<ITEM\>/, target);
                    
            var grammar_loading_msg = 
                document
                .getElementById("melampus-strings")
                .getString("mp-loading-grammar");
            // open or replace the grammar window
            MP.xlate.grammarWindow = 
                 MP.xlate.openSecondaryWindow(
                    MP.xlate.grammarWindow,
                    "mp-grammar-window",
                    targetURL,
                    null,
                    null,
                    MP.xlate.showLoadingMessage,
                    [range.startContainer,grammar_loading_msg],
                    MP.xlate.hideLoadingMessage
                );
        }
    },
  
    showDeclensionTable: function(a_event,a_declUrl) 
    {

        var params = { suffixes: [],
                        word: MP.main.getCurrentBrowser().melampus.word
                     };
        
        var popup = $("#mp-text", content.document);

        // The word will have one more more mp-infl-set elements
        // Each mp-infl-set element should have a mp-suffix element
        // and one or more mp-case elements.  Iterate through the mp-infl-sets
        // retrieving only those mp-suffix elements which are applicable to
        // either a noun or a verb_participle
        $(".mp-infl-set",popup).each(
            function(i)
            {
                var nouns = $(".mp-case[context$='noun']",this);
                var verb_participles = 
                    $("span.mp-case[context$='verb_participle']",this);
                if (nouns.length > 0 || verb_participles.length > 0 ) 
                {
                    params.suffixes.push($(".mp-suff",this).get());
        
                }
            }
        );
        
        if (params.suffixes.length > 0) 
        {
            // send the word endings to the declension table
            // if the window isn't already open, open it
            this.declension_table
                    = window.openDialog(a_declUrl,
                        "mp-decl-table",
                        "chrome=yes," + 
                        "dialog=no," + 
                        "width=300px,height=620px," + 
                        "resizable=yes,scrollbars=yes",
                        params);
            this.declension_table.focus();
            MP.util.log("Declension table should have focus with " 
                        + MP.main.getCurrentBrowser().melampus.word);
        }

    },

    /*
     * Close the declension table (if it's not already)
     */
    hideDeclensionTable: function() 
    {
        if (this.declension_table != null && ! this.declension_table.closed) 
        {
            this.declension_table.close();  
            this.declension_table = null;
        }
    },
    
    /* openSecondaryWindow - Open or replace a popup window
     *   Arguments:
     *     a_window :       a reference to the window, if it exists already
     *     
     *     a_name :         the name of the new window
     *     
     *     a_ url :         the url to load in the window
     *     
     *     a_feature :      optional feature string for the window
     *  
     *     a_window_args:   optional array of arguments to pass 
     *                      to the new window
     *                                            
     *     a_start_call:    optional callback to be executed
     *                      just before opening the window
     *                      
     *     a_start_args:    optional array of arguments to pass to the
     *                      a_start_call callback
     *                       
     *     a_load_call:      optional callback to be installed as an
     *                       onload event handler in the new window
     *   Returns: the window
     *   TODO - this should probably move the MP.utils namespace                      
     */
    openSecondaryWindow: function(
        a_window,
        a_name,
        a_url,
        a_features,
        a_window_args,
        a_start_call, 
        a_start_args,
        a_load_call)  
    {

        // the target window can call the passed in function
        // to remove the loading message

        if (a_window == null || a_window.closed)
        {
        
            MP.util.log("Opening new window named: " + a_name);
            // add a loading message to notify the user we're loading
            // the grammar - really this should come from a 
            // stringbundle if we're going to keep it
            if (a_start_call != null) {
                a_start_call(a_start_args);
            }
        
            // set the feature string for the new window
            // if one wasn't supplied
            // note that the chrome feature seems to impact
            // the behavior of javascript installed in the chrome
            // of the newly opened window
            var features = a_features ||
                "chrome=yes, " +  
                "dialog=no, " +
                "resizable=yes, " +
                "width=800, " +
                "height=600 " +
                "scrollbars=yes";
                
                
            a_window = window.openDialog(
                a_url,
                a_name,
                features
                // TODO - pass in a_window_args
                );
                
            // install the onload handler in the new window
            if (a_load_call != null) 
            {
                a_window.addEventListener(
                            "load",
                            a_load_call,
                            false);
            }
        }
        // the target window is already open, replace the location
        else 
        {
            var current_location = a_window.location;
                
            var match_result =
                a_url.match(/^(\w+):\/\/([^\/]+)(\/\S*?)(#.+)?$/);
            // if a match, full string is in match_result[0]
            var target_host = match_result[2];
            var target_path = match_result[3];
            var target_hash = match_result[4];

            // if the target url is the same as the current url
            // and both specify a named location in the same file,
            // replace just the hash part of the location to prevent 
            // reloading the window with the new location
            if (target_hash != null &&
                current_location.host == target_host &&
                current_location.pathname == target_path &&
                a_window.location.hash != null &&
                a_window.location.hash != ''
                )
            {
                MP.util.log("Replacing location hash with " + target_hash);
                a_window.location.hash = target_hash;
            }
            // otherwise, just replace the location and allow the window
            // to reload. It should come into focus before replacing the 
            // location, so adding loading message to the source window
            // shouldn't be necessary
            else 
            {
                MP.util.log("Replacing location with " + a_url);
                a_window.location = a_url;
            }
            
        }
        // now focus the window
        a_window.focus();
        MP.util.log("Secondary window should have focus at "+ a_url);
        return a_window;
    },
    
    hideLoadingMessage: function(e) 
    {
        $("#mp-secondary-loading",content.document).remove();        
    },
    
    showLoadingMessage: function(args) 
    {        
        if ($("#mp-secondary-loading",args[0]).length == 0 )
        {
            $(args[0]).append(
                '<div id="mp-secondary-loading">' + args[1] + '</div>');
        }
    }

};

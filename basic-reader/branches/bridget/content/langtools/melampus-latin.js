MP.Languages.Latin = function() 
{ 
    // properties could be retrieved from language-specific 
   // preferences
    MP.LanguageTool.call(this,{});
};

MP.Languages.Latin.prototype = new MP.LanguageTool();

MP.Languages.Latin.prototype.findSelection = function(a_ro, a_rngstr)
{

    var result = this.doSpaceSeparatedWordSelection(a_ro, a_rngstr);
    
    //TODO -- additional transliterations required for whitakers words
    if (typeof result.word != "undefined")
    {
        var word = result.word;
        word = word.replace(/\xC6/g, "AE");
        word = word.replace(/\xE6/g, "ae");
        word = word.replace(/\x152/g, "OE");
        word = word.replace(/\x153/g, "oe");
        result.word = word;
    }
    
    return result;
}

MP.Languages.Latin.prototype.translateWord = function(a_target,a_callback)
{
        
        MP.util.log("Query word: " + a_target.word);
        
        // TODO should really only do this once, using a listener 
        // on the preferences
        var auth;
        if (MP.util.getPref("url.lexicon.id")) {
            auth = 
                Base64.encode(
                    MP.util.getPref("url.lexicon.id") + 
                    ':' +
                    MP.util.getPref("url.lexicon.pass"));    
        }
        
        var url = MP.util.getPref("url.lexicon");
        url = url.replace(/\<WORD\>/,encodeURIComponent(a_target.word));
        
        // send asynchronous request to the lexicon service
        $.ajax(
            {
                type: "GET",
                url: url,
                beforeSend: function(req) 
                    { req.setRequestHeader('Authorization',
                                            'Basic ' + auth);
                    },
                dataType: 'html',
                error: MP.xlate.ajaxError,
                success: function(data, textStatus) 
                    { a_callback(data); } 
            }
        );        
};

// Latin shows the Declension Table window for the selected word
// when the shift key is pressed (if the popup window is displayed)
MP.Languages.Latin.prototype.handleShiftTool = function(a_event) 
{
    if ($("#mp-window",window.content.document).is(':visible')) {
        MP.xlate.showDeclensionTable(
            a_event,
            //TODO - declension table contents are language-specific
            // url should be defined in a preference
            "chrome://melampus/content/melampus-decl.xul");
    }
}

// Latin has a click handler on certain elements of the translation popup
// which brings up a Grammar display
MP.Languages.Latin.prototype.contextClick = function(a_doc)
{
    $("#mp-text",a_doc).bind("click", MP.xlate.grammarClickHandler);
};
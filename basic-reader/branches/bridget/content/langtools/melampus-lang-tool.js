// initialize the MP namespace
if (typeof MP == "undefined") 
{
    MP = {};
}

if (typeof MP.Languages == "undefined") 
{
    MP.Languages = {};
}


/**
 * Constructor 
 *   Arguments:
 *     properties: properties to set as private members of the object
 *                 accessor methods will be dynamically created
 */
MP.LanguageTool = function(properties) 
{
    var default_properties =
    {
        context_forward: 0,
        context_back: 0
    };

    this.set_accessors(default_properties);
    this.set_accessors(properties);  

};
 

/**
 * set_accessors - creates accessor methods on the instance
 *                 for the supplied properties object
 *   Arguments: 
 *      properties: properties for which to set accessors
 */
MP.LanguageTool.prototype.set_accessors = function(properties) 
{
        var myobj = this;
        for ( var prop in properties ) 
        { 
            ( function()
              {
                       var myprop = prop;
                       myobj[ "get"+ myprop ] = function() 
                       {
                           return properties[myprop];
                       };
                 
                       myobj[ "set" + myprop ] = function(val) 
                      {
                          properties[myprop] = val;
                      };
               
              }
            )();
        }
};

/**
 * findSelection: given a string and an offset into that string
 *               find the word or words which encompassing the range offset
 *               (to be fed to a lexicon tool).
 * Arguments:
 *     a_ro: the range offset
 *     a_rangstr: the string of characters containing the range offset
 * Return:
 *     object with the following properties:
 *         word: the target word or words
 *         word_start: the offset in the original string which represents the 
 *                     start of the word
 *         word_end:   the offset in the original string which represents the
 *                     end of the word
 *         context_str:optional relevant surrounding context
 *         context_pos: position of the word in the surroundin context
 *    TODO - we should probably define an official prototype for this object  
 */
MP.LanguageTool.prototype.findSelection = function(a_ro, a_rngstr)
{
    alert("No selection method defined");
    return {};
}

/**
 * translateWord: looks up the target selection in the lexicon tool
 *   Arguments:
 *      a_target: the target selection object (returned by findSelection)
 *      a_callback: a callback method. Takes the lexicon output as an argument;
 */
MP.LanguageTool.prototype.translateWord = function(a_target,a_callback)
{
    alert("No translation method defined");
    return;
};

/**
 * contextClick
 */
MP.LanguageTool.prototype.contextClick = function(a_doc) 
{
    // default is to not add a context click handler 
    return;
};

/**
 * handleShiftTool
 */
MP.LanguageTool.prototype.handleShiftTool = function(a_event)
{
    // default is to do nothing
    return;
};

/**
 * doSpaceSeparatedWordSelection - helper method for findSelection which
 *                                 identifies target word and surrounding
 *                                 context for languages whose words are
 *                                 space-separated
 *  See findSelection for Arguments and Return values
 */
MP.LanguageTool.prototype.doSpaceSeparatedWordSelection = 
function(a_ro, a_rngstr)
{

    var result = {};
    
    // clean string:
    //   convert punctuation to spaces
    a_rngstr = a_rngstr.replace(/[.,;:!?'\"(){}\[\]\/\\\xA0\n\r]/g, " ");

    // skip back to end of previous word
    while ((a_ro > 0) && (a_rngstr[--a_ro] == ' '));

    // remove leading white space
    var nonWS = a_rngstr.search(/\S/);
    a_rngstr = a_rngstr.substr(nonWS).replace(/(\r|\n)/, " ");
    a_ro -= nonWS;

    // find word
    var wordStart = a_rngstr.lastIndexOf(" ", a_ro) + 1;
    var wordEnd = a_rngstr.indexOf(" ", a_ro);

    if (wordEnd == -1)
        wordEnd = a_rngstr.length;

    
    // if empty, nothing to do
    if (wordStart == wordEnd) 
    {
        return result;
    }

    //extract word
    var word = a_rngstr.substring(wordStart,wordEnd);

    
    /* Identify the words preceeding and following the focus word
     * TODO - if the content is marked up, and the word is the only 
     * word in the parent of the rangeParent text node, we should 
     * traverse the DOM tree to pull in the surrounding context.
     * 
     * We also need to be able to pull surrounding context for text
     * nodes that are broken up by formatting tags (<br/> etc))  
     */
    var context_forward = this.getcontext_forward();
    var context_back = this.getcontext_back();
        
    var context_str = null;
    var context_pos = 0;
        
    if (context_forward || context_back) { 
        var startstr = rngstr.substring(0, wordEnd);
        var endstr = rngstr.substring(wordEnd+1, rngstr.length);
        var pre_wordlist = startstr.split(/\s+/);
        var post_wordlist = endstr.split(/\s+/);

        // limit to the requested # of context words
        // prior to the selected word
        // the selected word is the last item in the 
        // pre_wordlist array
        if (pre_wordlist.length > context_back + 1) {
            pre_wordlist = 
            pre_wordlist.slice(pre_wordlist.length-(context_back + 1));
        }
        // limit to the requested # of context words
        // following to the selected word
        if (post_wordlist.length > context_forward) 
        {
            post_wordlist = post_wordlist.slice(0, context_forward);
        }

        /* TODO: should we put the punctuation back in to the
        * surrounding context? Might be necessary for syntax parsing.
        */

        context_str = 
            pre_wordlist.join(" ") + " " + post_wordlist.join(" ");
        context_pos = pre_wordlist.length - 1;
    }
    
    result.word = word;
    result.wordStart = nonWS + wordStart;
    result.wordEnd = nonWS + wordEnd;
    result.context_str = context_str;
    result.context_pos = context_pos;
    return result;
};

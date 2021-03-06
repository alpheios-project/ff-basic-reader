/**
 * @fileoverview This file contains the Alph.interact class with 
 * interactive interface functionality
 * 
 * @version $Id$
 * 
 * Copyright 2008-2009 Cantus Foundation
 * http://alpheios.net
 * 
 * This file is part of Alpheios.
 * 
 * Alpheios is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Alpheios is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * @class Controls quiz mode functionality.
 */
Alph.Interactive = {


    /**
     * Check to see if the query window is currently visible
     */
    queryVisible: function(a_bro)
    {
        var query_win =
            Alph.Main.getStateObj(a_bro).getVar("windows")['alph-query-window'];
        var window_open = false;
        try 
        {
            window_open = (query_win != null && ! query_win.closed);
        }
        catch(a_e)
        {
            // FF 3.5 throws an error checking the .closed property of a closed chrome window
        }
        return window_open;
    },
    
    /**
     * Check to see if interactive features are enabled
     * @returns true if the current level is Alph.Constants.LEVELS.LEARNER, otherwise false
     * @type boolean
     */
    enabled: function(a_bro)
    {
        return Alph.Main.getMode() == Alph.Constants.LEVELS.LEARNER;

    },
    
    /**
      * Opens a new window with the query display 
      * @param {Document} a_topdoc the contentDocument which contains the popup
      * @param {Alph.SourceSelection} a_target the target selection
      * @param {Alph.LanguageTool} a_langTool the language tool
      */
     openQueryDisplay: function(a_topdoc,a_target,a_langTool)
     {
        var popup = a_topdoc.getElementById('alph-window');
        if (! this.enabled())
        {
            // don't do anything if the interactive features aren't enabled
            Alph.$(popup).removeClass("query-pending");
            return;
        }
        
        var browser = Alph.BrowserUtils.browserForDoc(window,a_topdoc) || Alph.Main.getCurrentBrowser();              
        var pofs_list = a_langTool.getPofs();
        var valid_pofs = Alph.$('#alph-text .alph-pofs',popup).attr('context');
        var has_pofs = false;
        for (var p_i = 0; p_i < pofs_list.length; p_i++)
        {
            if (pofs_list[p_i] == valid_pofs)
            {
                has_pofs = true;
                break;
            }
        }
   
        // quiz for multiple words at once is not yet supported
        // and don't do quiz if we don't know about the selected word's part of speech
        if (Alph.$("#alph-text .alph-word",popup).length != 1
            || ! has_pofs)
        {
            Alph.$(popup).removeClass("alpheios-inline-query").removeClass("query-pending");
            Alph.$(".alph-word-first",popup)
                .prepend('<div class="alpheios-hint">' + Alph.Main.getString('alph-query-notsupported') + '</div>');
            return;
        }
        var source_align = Alph.$(a_target.getRangeParent()).parents().attr('nrefs');
        if (source_align)
        {
            source_align = source_align.split(/\s|,/);
        }
        else
        {
            source_align = [];
        }
        var params =
        {
            lang_tool: a_langTool,
            main_str: Alph.Main.d_stringBundle,
            source_node: Alph.$("#alph-text",popup).get(0),
            source_align: source_align || [],
            transform: Alph.Xlate.transform,

        }
        // if the translation panel is open, offer interactive identification
        // of definitions, unless the dependency tree display was the source of the
        // selection
        if (Alph.Main.d_panels['alph-trans-panel'].isVisibleInline()
            && Alph.$("#dependency-tree",a_topdoc).length == 0)
        {
            if (source_align.length > 0)
            {
                var selected_word = Alph.$(".alph-word",popup).attr("context");
                var src_lang = a_langTool.d_sourceLanguage; 
                Alph.$(popup).addClass("alpheios-inline-query");
                Alph.$("#alph-text",popup).append(
                    '<div id="alph-inline-query-instruct">' +
                    Alph.Main.getString("alph-inline-query-instruct",[selected_word]) +
                    '</div>' +
                    '<div id="alph-align-answer-prompt"/>' + 
                    '<div id="alph-inline-query-correct">'+
                    '<span class="alph-inline-query-heading">' +
                    Alph.Main.getString("alph-inline-query-correct") +
                    '</span>' +
                    '</div>' +
                    '<div id="alph-inline-query-incorrect">'+
                    '<span class="alph-inline-query-heading">' +
                    Alph.Main.getString("alph-inline-query-incorrect") +
                    '</span>' +
                    '</div>'
                );
                Alph.Xlate.repositionPopup(Alph.$(popup).removeClass("query-pending"));
            
                params.type = 'infl_query';
                params.aligned_ids = [];
                params.aligned_defs = [];
                Alph.Main.d_panels['alph-trans-panel'].enableInteractiveQuery(params);
            }
            // if the word isn't aligned, just display the query window
            else
            {
                // hide the popup - but don't call hidePopup because that resets
                // state which we might need
                Alph.$(popup).css("display","none").removeClass("query-pending");
                params.type = 'infl_query';    
                params.target= a_target;
                this.openQueryWindow(params);
            }
        }
        else
        {
            // hide the popup - but don't call hidePopup because that resets
            // state which we might need
            Alph.$(popup).css("display","none").removeClass("query-pending");
            params.type = 'full_query';    
            params.target= a_target;
            this.openQueryWindow(params);
        }
     },
     
     
     /**
      * open the query window
      */
     openQueryWindow: function(a_params)
     {
        var features =
            {
                chrome: "yes",
                dialog: "no",
                resizable: "yes",
                width: "800",
                height: "800",
                scrollbars: "yes"
            };
        var query_win = 
              Alph.Xlate.openSecondaryWindow(
              "alph-query-window",
              Alph.BrowserUtils.getContentUrl() + "/query/alpheios-query.xul",
              features,  
              a_params
            );
     },
     
     /**
      * Response to a click on an aligned word
      */
     checkAlignedSelect: function(a_event)
     {
        // event handler so 'this' is the element that was clicked on or selected
        var selection = this;
        
        // don't do anything if we're not in query  mode
        if (! Alph.Interactive.enabled())
        {
            return;
        }
        
        // make each word in the alignment only selectable once
        Alph.$(selection).unbind('click',Alph.Interactive.checkAlignedSelect);
        
        var params = a_event.data;
        
        var selected_id = Alph.$(selection).attr("id");
        
        var matched = false;
        params.source_align.forEach(
            function(a_id)
            {
                if (selected_id == a_id)
                {
                    params.aligned_ids.push(selected_id);
                    params.aligned_defs.push(Alph.$(selection).text());
                    matched = true;
                }
            }
        );
     
        if (! matched)
        {
            Alph.$("#alph-align-answer-prompt",params.source_node.ownerDocument)
                .html(Alph.Main.getString("alph-query-incorrect"));
        }
        else if (params.aligned_ids.length < params.source_align.length)
        {
            Alph.$("#alph-align-answer-prompt",params.source_node.ownerDocument)
                .html(Alph.Main.getString("alph-query-more"));
        }
        
        if (params.aligned_ids.length == params.source_align.length)
        {
            Alph.$("#alph-align-answer-prompt",params.source_node.ownerDocument)
                .html('');
            Alph.$("#alph-window",params.source_node.ownerDocument).css("display","none");
            Alph.Interactive.openQueryWindow(params);
        }
        else
        {
            if (matched)
            {
                Alph.$("#alph-inline-query-correct",params.source_node.ownerDocument)
                    .append('<span>' + Alph.$(selection).text() + '</span>')
                    .addClass("alph-align-answer");
            }
            else
            {
                Alph.$("#alph-inline-query-incorrect",params.source_node.ownerDocument)
                    .append('<span>' + Alph.$(selection).text() + '</span>')
                    .addClass("alph-align-answer");
            }
        }
     },
     /**
      * Responds to a click on the link to identify the inflection. Opens the inflection
      * table window in query mode.
      * @param {Event} a_event the click event
      * @param {Element} the element which was clicked
      * @param {Alph.LanguageTool} the LanguageTool being used to provide the answers
      */
     handleInflClick: function(a_event,a_link,a_lang_tool)
     {
        
        var query_parent = Alph.$(a_link).parent('.alph-query-element').get(0); 
        var pofs_set = Alph.$('.alph-pofs',query_parent.previousSibling);
        var infl_set = Alph.$('.alph-infl-set',query_parent.previousSibling);
        var text_node = Alph.$(a_link).parents('#alph-text');
        
        var context_list = [];

        var base_ctx = 
        {
            // skip declension and conjugation for now -- may add back in later
            //'alph-decl': Alph.$('.alph-decl',query_parent.previousSibling).attr('context'),
            //'alph-conj': Alph.$('.alph-conj',query_parent.previousSibling).attr('context')
        }
        Alph.$('.alph-infl',infl_set).each(
            function()
            {
                var context = Alph.$.extend({},base_ctx);
                context['alph-num'] = Alph.$('.alph-num',this).attr('context');
                context['alph-gend'] = Alph.$('.alph-gend',this).attr('context');
                context['alph-tense'] = Alph.$('.alph-tense',this).attr('context');
                context['alph-voice'] = Alph.$('.alph-voice',this).attr('context');
                context['alph-pers'] = Alph.$('.alph-pers',this).attr('context');
         
                // one inflection set may contain many cases
                var cases = Alph.$('.alph-case',this);
                if (cases.length > 0)
                {
                    Alph.$(cases).each(
                        function()
                        {
                            var case_ctx = 
                                Alph.$.extend({},context);
                            
                            //  context is in form <case>-<num>-<gend>-<pofs>
                            var atts = Alph.$(this).attr('context').split(/-/);
                            case_ctx['alph-case'] = atts[0];
                            case_ctx['alph-num'] = atts[1];
                            case_ctx['alph-gend'] = atts[2];
                            context_list.push(case_ctx)
                        }                            
                    );
                }    
                else
                {
                    context_list.push(context);
                }
            }
        );
        
        var infl_params = 
        {
            query_mode: true,
            showpofs:   pofs_set.attr('context'),
            infl_set_contexts: context_list,   
            query_parent: query_parent.previousSibling
        };
        //a_lang_tool.handleInflections(a_event,text_node,infl_params);
     },
     
    /**
     * Check whehter a selected inflection is correct
     * @param {Element} a_ending the HTML element containing the inflected form or ending
     * @param {Object} a_params the params object that was passed to the inflection table
     *                          window (which contains all the context for the window)
     * @returns true if the selection was correct, otherwise false
     * @type boolean
     */
     checkInflection: function(a_ending,a_params)
     {
        // iterate through valid contexts for the source term,
        // and if the context of the selected inflection  matches one
        // then it is a correct answer
        var correct = false;

        // get rid of any trailing - on the context
        var a_context = Alph.$(a_ending).attr('context').replace(/-$/,'');
        
        var selected_atts = a_context.split(/-/);
        var num_atts = selected_atts.length;
        
        for (var j=0; j<a_params.infl_set_contexts.length; j++) 
        {
            var a_ctx = a_params.infl_set_contexts[j];
            
            var matched_atts = 0;
            for (var i=0; i<num_atts; i++)
            {
                var att = selected_atts[i].split(/:/);
                var att_name = 'alph-' + att[0];
                if (typeof a_ctx[att_name] != 'undefined' &&
                    a_ctx[att_name] == att[1])
                {
                    matched_atts++;
                }
                
            }   
            if (matched_atts == num_atts)
            {
                correct = true;
                break;
            }
            
        }
        if (correct)
        {
            alert(Alph.Main.getString("alph-query-correct"));
            Alph.$('.alph-decl',
                a_params.query_parent).css('display','inline');
            Alph.$('.alph-conj',
                a_params.query_parent).css('display','inline');
            Alph.$('.alph-infl-set',
                a_params.query_parent).css('display','block');
            Alph.$('.alph-pofs .alph-attr',a_params.query_parent)
                    .css('display','inline');
            Alph.$('.alph-entry *',a_params.query_parent).show();
            Alph.$('.alph-query-infl',a_params.query_parent.nextSibling).css('display','none');
            
            return true;
        }
        else
        {
            alert(Alph.Main.getString("alph-query-incorrect"));
            Alph.$(a_ending).addClass('incorrect');
            return false;
        }    
     },
     
     /**
      * close the query display window
      * @param {Browser} a_bro the current browser
      */
     closeQueryDisplay: function(a_bro)
     {
        if (this.queryVisible())
        {
            Alph.Main.getStateObj(a_bro).getVar("windows")['alph-query-window'].close();
        }
     },
     
     /**
      * get the query document
      * @returns the query document
      * @type Document
      */
     getQueryDoc: function()
     {
        var doc = null;
        if (this.queryVisible())
        {
            var win = Alph.Main.getStateObj().getVar("windows")['alph-query-window'];
            doc = win.$("#alph-query-frame").get(0).contentDocument;
        }
        return doc;
     }
}
/*
 * Javascript Handler for the Melampus Options dialog
 */

// initialize the MP namespace
if (typeof MP == "undefined") {
    MP = {};
}

MP.decl = {
    
    /**
     * onLoad handler for the window
     */
    onLoad: function() {
        var link_target = window.arguments[0];
        var tbl = $('#noun-declension-table',window.content.document);
        this.showCols(tbl,link_target);
        this.resize_window(window.content.document);
        
    },
    
    init_table: function(tbl) {
        // initialize the mouseover highlighting for the table
        // which also sets the realIndex for each cell
        $(tbl).tableHover({colClass: "highlight-hover",
                           rowClass: "highlight-hover",
                           headCols: true});
    },
 
    showCols: function(tbl,link_target) {
        
        var topdoc = window.content.document || window.document;
        this.init_table(tbl);
        
        var suffix_map = {};
        var suffix_list = jQuery.map(link_target.suffixes,function(n){
            var ending = $(n).text();
            if (ending == '') {
                ending = '&lt;none&gt;'
            }
            // remove duplicates from the list of suffixes
            // for some reason the jQuery.unique function doesn't work
            if (suffix_map[ending]) 
            {
                return;
            }
            else 
            {
                suffix_map[ending] = true;
                return ending;
            } 
        });
        
        suffix_list = 'case-endings: ' + suffix_list.join(", ");

        // show the word we're working with
        $("caption",tbl).html(link_target.word + " (" + suffix_list + ")");

        // for each ending in the table, highlight it if there's a matching suffix
        // in the link source
        if ( link_target.suffixes != null && link_target.suffixes.length > 0 ) {
            var col_parents = [];
            $("span.ending",tbl).each( function(i) {
                for (var j=0; j<link_target.suffixes.length; j++ ) {                    
                    if (MP.decl.decode($(this).text()) == 
                        jQuery.trim($(link_target.suffixes[j]).text()) ) {
                        $(this).addClass("highlight-ending");
                        var td_parent = $(this).parent("td");
                        $(td_parent).addClass("highlight-ending");

                        // get the realIndex (column index) for each cell containing
                        // a matched ending, so that we can make all cells in this column
                        // visible
                        col_parents.push($(td_parent).get(0).realIndex);                        
                    }
                }
            });
            //MP.util.log(link_target.word + ": col_parents: " + col_parents.join(","));
            var col_parent_elements = $("col",tbl);
            var sib_cols = [];
            
            // iterate through the col elements with the same realIndex as those
            // of the matched cells, identifying the realIndexes of the 
            // sibling columns (i.e. columns in the same colgroup), so that we can 
            // display all columns in the column group.
            // ideally we wouldn't need to do this, and could just set visibility
            // at the colgroup level, but Firefox's handling of the visibility css
            // style on tables is very buggy
            for (var i=0; i<col_parents.length; i++) {
                var col_index = col_parents[i];
                var col_realIndex = $(col_parent_elements[col_index]).attr("realIndex"); 
                if (sib_cols.indexOf(col_realIndex) == -1) {
                    sib_cols.push(col_realIndex);
                }
                $(col_parent_elements[col_index]).siblings().each(function(){
                    var sib_index = $(this).attr("realIndex");
                    if (sib_cols.indexOf(sib_index) == -1) {
                        sib_cols.push(sib_index);
                    }
                });
            }
            // unhide all the cells in the colgroups to which the matched
            // endings belonged
            for (var i=0; i<sib_cols.length; i++) {
                $("td[realIndex='" + sib_cols[i] + "']",tbl).css("display","table-cell");
                $("th[realIndex='" + sib_cols[i] + "']",tbl).css("display","table-cell");
            }

            $("#expand-table-link",topdoc).css("display","block");
            $("#expand-table-link",topdoc).click( function(e) {
                MP.decl.expand_table(tbl,topdoc);
                return false;
            });
        } 
        // if we didn't have any suffixes, just display the whole table
        // with nothing highlighted
        else {
            MP.decl.expand_table(tbl,topdoc);            
        }
    },
    
    expand_table: function(tbl,topdoc) {
        $("th",tbl).css("display","table-cell");
        $("td",tbl).css("display","table-cell");
        $("#expand-table-link",topdoc).css("display","none");
        MP.decl.resize_window(topdoc);
    },
    
    resize_window: function(topdoc) {
        // resize the window
        var y = $("#noun-declension-table",topdoc).get(0).offsetHeight + 60;
                    
        // add a little room to the right of the table 
        var x = $("#noun-declension-table",topdoc).get(0).offsetWidth + 50;
                    
        if (x > window.availWidth) {
            x=availWidth
        }
        if (y > window.availHeight) {
            y = window.availHeight;
        }
        window.resizeTo(x,y);
        
    },
    
    entities: { },
                    
    /**
     * TODO - this should eventually move to a multi-purpose object
     * for handing encodings
     */
    decode: function(str) {
        
        // replace the &nbsp; before trimming the string
        str = str.replace(/\xA0/g, '***');
        
        str = jQuery.trim(str);
        // only decode each entity once
        if (this.entities[str]) {
            return this.entities[str];
        }
        str = str.replace(/&#257;/g, 'a');
        str = str.replace(/\u0101/g, 'a');
        str = str.replace(/&#275;/g, 'e');
        str = str.replace(/\u0113/g, 'e');
        str = str.replace(/&#299;/g, 'i');
        str = str.replace(/\u012b/g, 'i');
        str = str.replace(/&#333;/g, 'o');
        str = str.replace(/\u014d/g, 'o');
        str = str.replace(/&#363;/g, 'u');
        str = str.replace(/\u016b/g, 'u');
        str = str.replace(/_|-/g, '');
        str = str.replace(/_|-/g, '');
        str = str.replace(/&nbsp;/g, '***');
        return str;        
    },
    
    onKeyDown: function(e) {
        // shift key handler - hand the event off to the parent window
        // only effective while the mouseover popup is visible
        if (e.keyCode == 16) {
            if ($("#mp-window",window.opener.content.document).is(':visible')) {
                window.opener.MP.xlate.showDeclensionTable();
            }
        }
        // return true to allow event propogation if needed
        return true;
    }
    
    
};
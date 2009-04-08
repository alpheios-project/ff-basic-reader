<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:import href="beta-uni-util.xsl"/>
    <xsl:import href="uni2ascii.xsl"/>
    
    <xsl:template name="check_infl_sets">
        <xsl:param name="selected_endings"/>
        <xsl:param name="current_data"/>
        <xsl:param name="match_pofs"/>
        <xsl:param name="strip_greek_vowel_length"/>
        <xsl:variable name="matches">
            <xsl:for-each select="$selected_endings//div[@class='alph-infl-set' and 
                ../div[@class='alph-dict']//span[(@class='alph-pofs') and (@context = $match_pofs)]]
                ">                    
                <xsl:variable name="ending_match">
                    <xsl:choose>
                        <!-- empty suffixes are matched with _ -->
                        <xsl:when test="span[@class='alph-term']/span[@class='alph-suff' and not(text())]">_</xsl:when>
                        <xsl:when test="$strip_greek_vowel_length = true()">
                            <xsl:call-template name="uni-strip">
                                <xsl:with-param name="input" select="span[@class='alph-term']/span[@class='alph-suff']"/>
                                <xsl:with-param name="strip-vowels" select="true()"/>
                                <xsl:with-param name="strip-caps" select="false()"/>
                            </xsl:call-template>                              
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="span[@class='alph-term']/span[@class='alph-suff']"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:variable>
                <xsl:variable name="possible">
                    <xsl:for-each select="div[@class='alph-infl']">
                        <xsl:call-template name="find_infl_match">
                            <xsl:with-param name="current_data" select="$current_data"/>
                            <xsl:with-param name="filtered_data" select="(.)"/>
                            <xsl:with-param name="match_pofs" select="$match_pofs"/>
                        </xsl:call-template>
                    </xsl:for-each>
                </xsl:variable>
                <xsl:if test="$possible &gt; 0">,<xsl:value-of select="$ending_match"/>,</xsl:if>
            </xsl:for-each>    
        </xsl:variable>
        <xsl:value-of select="$matches"/>
    </xsl:template>
    
    <xsl:template name="find_infl_match">
        <xsl:param name="current_data"/>
        <xsl:param name="filtered_data"/>
        <xsl:param name="match_pofs"/>
        <xsl:param name="att_pos" select="0"/>
        
        <xsl:variable name="num_atts" select="count($current_data/@*)"/>
        <xsl:choose>
            <!-- if we don't have any attributes to check on the current cell
                then just skip it
            -->            
            <xsl:when test="$num_atts = 0">0</xsl:when>
            <xsl:when test="$current_data/@case">
                <!-- handle attributes with case non-recursively because we need
                     to match case number and gender together
                -->
                    <xsl:variable name="match_case" select="
                        concat(
                        '|',
                        translate($current_data/@case,' ','|'),
                        '|')"/>
                    <xsl:variable name="match_num" select="
                        concat(
                        '|',
                        translate($current_data/@num,' ','|'),
                        '|')"/>
                    <xsl:variable name="match_gend">
                        <xsl:value-of select="
                            concat(
                                '|',
                                translate($current_data/@gend,' ','|'),
                                '|')"/>
                        <!-- make sure that we match the 'common' gender for 
                             endings which are either masculine or feminine
                        -->
                        <xsl:if test="contains($current_data/@gend, 'masculine') or
                            contains($current_data/@gend,'feminine')">
                            |common|
                        </xsl:if>
                    </xsl:variable>
                <xsl:choose>
                    <xsl:when test="$filtered_data/../..//span[@class='alph-decl' 
                        and contains(@context,$current_data/@decl)]">
                        <xsl:value-of select="count($filtered_data//span[@class='alph-case'
                            and contains($match_case,concat('|',substring-before(@context,'-'),'|'))
                            and (@alph-pofs = $match_pofs)
                            and contains($match_gend,concat('|',@alph-gend,'|'))
                            and contains($match_num,concat('|',@alph-num,'|'))
                            ])"/>        
                    </xsl:when>
                    <xsl:otherwise>0</xsl:otherwise>
                </xsl:choose>
            </xsl:when> 
            <xsl:when test="$att_pos = $num_atts">
                <!-- if we have tested all the possible attributes return the match count-->
                <xsl:value-of select="count($filtered_data)"/>
            </xsl:when>          
            <xsl:when test="($att_pos &lt; $num_atts) and $filtered_data">
                <!-- only try match if current data element has the attribute -->
                <xsl:for-each select="$current_data/@*">
                    <xsl:if test="position() = $att_pos + 1">
                        <xsl:variable name="att_name" select="name()"/>
                        <!-- should we skip this attribute? -->
                        <xsl:variable name="skip_att">
                            <xsl:call-template name="check_att">
                                <xsl:with-param name="att_name" select="$att_name"/>
                                <xsl:with-param name="data" select="$current_data"/>
                            </xsl:call-template>
                        </xsl:variable>
                        <!-- translate spaces to pipes in the attribute value so that we can
                             isolate each value
                        -->
                        <xsl:variable name="att_value">
                            <xsl:value-of select=
                                "concat(
                                '|',
                                translate($current_data/@*[local-name(.)=$att_name],' ','|'),
                                '|')"/>
                        </xsl:variable>                        
                        <xsl:choose>
                            <xsl:when test="$skip_att = '1'">
                                <!-- just advance the counter for the ones we're skipping -->
                                <xsl:call-template name="find_infl_match">
                                    <xsl:with-param name="current_data" select="$current_data"/>
                                    <xsl:with-param name="filtered_data" 
                                        select="$filtered_data"/>
                                    <xsl:with-param name="att_pos" select="$att_pos+1"/>                           
                                </xsl:call-template>                                
                            </xsl:when>
                            <xsl:otherwise>
                                <xsl:variable name="class_name">
                                    <xsl:value-of select="concat('alph-',$att_name)"/>
                                </xsl:variable>
                                <xsl:variable name="latest_data"
                                    select="$filtered_data[(
                                    (contains($att_value,concat('|',span[@class=$class_name]/text(),'|')))
                                    or
                                    (contains($att_value,concat('|',span[@class=$class_name]/@context,'|')))
                                    )]"/>
                                <xsl:call-template name="find_infl_match">
                                    <xsl:with-param name="current_data" select="$current_data"/>
                                    <xsl:with-param name="filtered_data" 
                                        select="$latest_data"/>
                                    <xsl:with-param name="att_pos" select="$att_pos+1"/>                           
                                </xsl:call-template>                                
                            </xsl:otherwise>
                        </xsl:choose>                                        
                    </xsl:if>
                </xsl:for-each>                
            </xsl:when>
            <xsl:otherwise>0</xsl:otherwise>
        </xsl:choose>
    </xsl:template>    
    
    <!-- template which can be overridden for language and pofs to control matching
         behavior
    -->
    <xsl:template name="check_att">
        <xsl:param name="att_name"/>
        <xsl:param name="data"/>
    </xsl:template>
</xsl:stylesheet>
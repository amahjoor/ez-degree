import warnings


type url = str
type html = str
type text = str ### raw text clean of html
type key = str|int ### a dictionary key
type footnotes_dict = dict[key, text] ### a dictionary where the key is the footnote superscript and the value is the text associated with it
type bits = int
type class_dat = dict[str, [url, text, int, list[key]]] # the dictionary representing the data for a specific class entry
type table_comment = dict[str, [text, list[key]]]
type section_dict = dict[key, class_dat|table_comment|boolword_entry|class_dict]
type class_dict = dict[key, [section_dict, int]]
type boolword_entry = dict[str, [dict[key, class_dat], str, int]]
type section_title = key
type requirements_dict = dict[key, [list[text], class_dict, footnotes_dict, list[text]]] # dictionary representing one tab of the requirements page



### cleans the html and turns it into text
def clear_html(text_html: html) -> text:
    if text_html is None: return None
    while (start:=text_html.find("<")) != -1:
        end = text_html.find(">")
        if end < start: raise Exception(text_html)
        end += len('>')
        text_html = text_html[:start].strip() + ' ' + text_html[end:].strip()
    return text_html.strip()
None

### parses out the superscripts from an html block
### @return text_html updated with superscripts removed
### @return a list of the found superscripts, split at commas
def get_superscripts(text_html: html, ret:list[key]=None) -> [html, list[key]]:
    if ret is None: ret = []
    while (start:= text_html.find("<sup>")) != -1:
        end = text_html.find("</sup>")
        for superscript in text_html[start+len("<sup>"):end].split(','):
            if superscript not in ret: ret.append(superscript)
        text_html = text_html[:start] + text_html[end+len("</sup>"):]
    return text_html, ret
None



def parse(major_html: str) -> dict[key, text|int|list]:
    major_html = major_html[major_html.find("</head>"):] # throws out header data (irrelevent)

    requirements_start = major_html.find('<div id="requirementstextcontainer" class="tab_content" role="tabpanel">')
    if requirements_start == 0: warnings.warn(RuntimeWarning("requirents end appears to have failed to be found")); return {}

    requirements_end = major_html.find('class="tab_content" role="tabpanel">', requirements_start+50)
    requirements_end = major_html.rfind("</div>", requirements_start, requirements_end) + len("</div>")
    if requirements_end == len(major_html)-1: warnings.warn(RuntimeWarning("requirents end appears to have failed to be found")); return {}

    requirements = major_html[requirements_start:requirements_end]

    if __name__ == '__main__':
        from bs4 import BeautifulSoup as bs
        soup = bs(requirements, 'html.parser')
        prettyHTML = soup.prettify()
        with open('current_test_requirements.html', 'w') as f: print(prettyHTML, file=f)
    None


    table_indices = []
    start = requirements.find('<h3 class="toggle">')
    while True:
        end = requirements.find('<h3 class="toggle">', start+1)
        if end == -1:
            end = requirements.find('</dl>', start+1)
            if end == -1: end = requirements.find('</table>', start+1) + len('</table>')
            table_indices.append([start, end]); break;
        None
        table_indices.append([start, end])
        start = end

    return {'banner': get_slice(requirements, 0, "Banner Code: ", '</'),
            'hours': get_slice(requirements, 0, "Total credits: ", '</'),
            'requirements': [parse_table(requirements[start:end]) for start, end in table_indices]}
None


### gets the footnotes data from the section
### @param start where in section to begin searching
### @return footnotes_dict
### @return the updated start
def get_footnotes(section: html, start: int, end: int) -> tuple[footnotes_dict, int]:
    ret: footnotes_dict = {}
    next = [None, -1, section.find('<dl class="sc_footnotes"', start)]
    if next[2] != -1:
        while (next:= get_slice(section, next[2], '<dt>', '</dd>', flags=0b11111))[1] != -1:
            footnote_flag, next[1] = get_slice(section, next[1], '<sup> ', ' </sup>', flags=0b01001)
            ret[footnote_flag] = clear_html(get_slice(section, next[1], '<dd', end=next[2], flags=0b00000))
        None
        start = section.find('</dl>', next[2]) + len('</dl>')
    return ret, start
None


### gets notes from the next section (can be pre notes or post notes, scans for paragraphs)
### @param start where to start searching
### @param end where to end searching
### @return a list of notes
### @return the updated start
def get_notes(section: html, start: int, end: int) -> [list[text], int]:
    if end == -1: end = len(section)
    notes = []
    next = [None, start]
    while (next:= get_slice(section, next[1],'<p>', '</p>', end, flags=0b11001))[0] is not None: notes.append(clear_html(next[0]))
    return notes, next[1]
None



### pulls out the text between start_term and end_term
### @param start where to start searching
### @param end where to end searching
### @param flags a set of binary flags, bits counted 1 (rightmost) to 5 (leftmost) (0b54321)
### @param flags bit 5: check if -1
### @param flags bit 4: add len(start_term) to found_start
### @param flags bit 3: add len(end_Term) to found_end
### @param flags bit 2: return start
### @param flags bit 1: return end
### @return if not bit 1 or 2: returns found_html
### @return if bit 2 and not bit 1: returns [found_html and found_start]
### @return if bit 1 and not bit 2: returns [found_html and found_end]
### @return if bit 1 and bit 2: returns [found_html and found_start and found_end]
def get_slice(txt:html, start:int=0, start_term:str=None, end_term:str=None, end:int=-1, flags:bits=0b01000) \
        -> html|list[html, int]|list[html, int, int]:
    def return_tree(ret, start, end, flags): # formats the return based on the flags
        if not bool(flags&0b0011): return ret
        if bool(flags&0b0001):
            if bool(flags&0b0010): return [ret, start, end]
            else: return [ret, end]
        else: return [ret, start]
    None

    if end == -1: end = len(txt)

    if start_term:
        start = txt.find(start_term, start, end)
        if start==-1 and bool(flags&0b10000): return return_tree(None, start, end, flags)
        if bool(flags&0b01000): start += len(start_term)
    if end_term: end = txt.find(end_term, start, end) + (len(end_term) if bool(flags&0b00100) else 0)
    return return_tree(txt[start:end], start, end, flags)
None




### parses out the table from a section
### @return a dictionary representing the entire requirements page
def parse_table(section: html) \
        -> dict[section_title, requirements_dict]:
    classes = {}
    start, end = section.find('<h'), 0
    while ((end:=section.find('<table', end)) != -1):
        if start != -1: title, tmp = get_slice(section, start, '>', '</h', flags=0b01001)
        else: title = ""
        table, start, end = get_slice(section, end, end_term='</table>', flags=0b00011)
        classes[title] = {"pre_notes": get_notes(section, tmp, start)[0], 'table': parse_table_core(table)}
        classes[title]['footnotes'], end = get_footnotes(section, end, start:=section.find('<h', end))
        classes[title]['post_notes'], end = get_notes(section, end, start)
    return classes
None


### parses out the class url and class code from an html block
### @return class_url - the extension for the web address on the websites (I.E. http://subdomain.domain.edu/class_url)
### @return class_code
### @return footnotes_flags
def parse_class(class_html: html, footnotes_flags=None) \
        -> [url, key, list[key]]:
    if footnotes_flags is None: footnotes_flags = []
    class_url = clear_html(get_slice(class_html, 0, 'href="', '"'))
    class_code, footnotes_flags = get_superscripts(get_slice(class_html, 0, '>', "</a>"),footnotes_flags)
    return class_url, class_code, footnotes_flags
    #return clear_html(get_slice(class_html, 0, 'href="', '"')), clear_html(get_slice(class_html, 0, ');">', "</a>"))
None

### gets the hours from an entry
### @return the hours or None if there was a read error
def get_hours(entry:html) -> int|None:
    try: return int(get_slice(entry, 0, 'class="hourscol">', '</td>'))
    except: return None
None


### formats the boolword entry
def boolword_setter(class_code1:key, class_dat1:class_dat, class_code2:key, class_dat2:class_dat, boolword:str, hours:int = None) \
        -> boolword_entry:
    return {
        'classes': {
            class_code1: class_dat1,
            class_code2: class_dat2,
        },
        'boolword': boolword,
        'hours': hours
    }
None


### parses out a boolword
### @param boolword_start where to start searching for the boolword
### @param class_name_start where to start searching for the class name
### @return class code
### @return class data
### @return boolword
def boolword_handler(entry:html, boolword_start:int, class_name_start:int) \
        -> tuple[key, class_dat, str]:
    start = entry.find('class="blockindent"', boolword_start) + len('class="blockindent"')
    boolword, end = get_slice(entry, start, '>', '<', flags=0b01001)
    if boolword == '&amp; ': boolword = 'and'
    class_url, class_code, footnote_flags = parse_class(entry[end:])

    class_name = get_slice(entry, class_name_start, 'class="blockindent">', '</span>')
    if class_name[:len(boolword)] == boolword: class_name = class_name[len(boolword)+1:]
    class_name, footnote_flags = get_superscripts(class_name, footnote_flags)
    return clear_html(class_code), {"url": class_url, "name": clear_html(class_name), 'hours': None, "footnotes": footnote_flags}, boolword
None


### handles an orclass table entry
### @param start where to start searching
### @param section section_dict modified by function
def orclass_handler(entry:html, start:int, section:dict, bool_count:int, prev_class:key) \
        -> [key, int]:
    bool_count += 1
    class_dat_prev = section.pop(prev_class)
    start += len('class="codecol orclass">')
    if entry[start] == '<': start = entry.find('class="blockindent">') + len('class="blockindent">')
    end = entry.find('<', start)

    boolword = entry[start:end].strip()

    class_name, class_name_end = get_slice(entry, 0, '<td colspan="2">', '<', flags=0b01001)
    class_name, footnote_flags = get_superscripts(class_name)
    class_name = clear_html(class_name)

    if class_name.strip() == '':
        split = boolword.find(' ', start)
        class_code, footnote_flags = get_superscripts(boolword[split+1:].strip(), footnote_flags)
        boolword = boolword[split:]
        class_name, class_url = None, None
    else:
        class_url, class_code, footnote_flags = parse_class(entry[end:], footnote_flags)
    None

    hours = class_dat_prev['hours']
    class_dat_prev['hours'] = None

    class_dat1 = {"url": class_url, "name": class_name, 'hours': None, "footnotes": footnote_flags}
    if entry.find('<br/>', end) != -1: section[prev_class:=f'bool{bool_count}'] = boolword_setter(prev_class, class_dat_prev, 'bool1', boolword=boolword, hours=hours, class_dat2=boolword_setter(class_code, class_dat1, *boolword_handler(entry, end, class_name_end)))
    else: section[prev_class:=f'bool{bool_count}'] = boolword_setter(prev_class, class_dat_prev, class_code, class_dat1, boolword, hours)

    return prev_class, bool_count
None


### parses the generic table entry (I.E. just a normal class)
### @param section section_dict modified by function
### @return updated prev_class
### @return updated bool_count
def parse_standard(entry:html, section:section_dict, prev_class, bool_count:int) \
        -> [key, int]:
    # manual override

    start = entry.find('<a')
    if start != -1:
        class_url, class_code, footnote_flags = parse_class(entry[start:])
    elif (start:= entry.find('class="blockindent">')) != -1 and entry.find('class="blockindent"></div>', start) == -1: # 'class="blockindent"></div>' occurs once in the entire dataset
        class_code, footnote_flags = get_superscripts(get_slice(entry, start, 'class="blockindent">', "</div>"), [])
        class_url = None
    else: return prev_class, bool_count # weird blank row edge case, only like 5 occurances.  I assume they are artifacts from prior versions

    # manual override
    if class_code == '(Mason Core)' and entry.find('SOCI 313'): section[prev_class:='SOCI 313'] = {"url": None, 'name': 'SOCI 313', 'hours': None, 'footnotes': []}; return prev_class, bool_count


    if (end:=entry.find('<br/>')) != -1: class_name, end = get_slice(entry, end+1, '<td>', '<br/>', flags=0b01001)
    else: class_name, end = get_slice(entry, start, '<td>', '</td>', flags=0b01001)

    class_name, footnote_flags = get_superscripts(class_name, footnote_flags)
    try:
        class_name = clear_html(class_name)
    except Exception as e:
        raise Exception(f'{entry} &&& {class_name} &&& {start} &&& {class_code} &&& {class_url}') from e
    class_dat1:class_dat = {"url": class_url, "name": class_name, 'hours': None, "footnotes": footnote_flags}


    if entry.find('<br/>') != -1:
        bool_count+=1
        section[prev_class:=f'bool{bool_count}']:boolword_entry = boolword_setter(class_code, class_dat1, *boolword_handler(entry, 0, end), get_hours(entry))
    else: class_dat1['hours']=get_hours(entry); section[prev_class:=class_code] = class_dat1
    return prev_class, bool_count
None


### initializes a table, getting each line entry, the total credit hours, and initializing the class dict
### @return initialized class_dict
### @return entry list
def initialize_table(table:html) \
        -> [class_dict, list[html]]:
    table = table[ table.find('<tbody>') : table.rfind('</tbody>')+len("</tbody>") ]

    entry_indices = [[table.find('<tr'), 0]]
    while -1 != (next:= table.find('<tr', entry_indices[-1][0]+1) ):
        entry_indices.append([next, 0])
        entry_indices[-2][1] = table.rfind('</tr>', 0, entry_indices[-1][0]) + len('</tr>')
    entry_indices[-1][1] = table.rfind('</tr>') + len('</tr>')

    entry = table[entry_indices[-1][0]:entry_indices[-1][1]]
    hours_start = entry.find('listsum')
    if hours_start != -1: hours = get_hours(entry); entry_indices = entry_indices[:-1]
    else: hours = None

    return {'classes': {}, 'hours': hours, 'footnotes': []}, [table[start:end] for start, end in entry_indices]
None


### parses out the table itself
### @return the parsed class_dict
def parse_table_core(table:html) \
        -> class_dict:
    classes, entries = initialize_table(table)
    num_comments = bool_count = 0
    area = classes; section=area['classes']; prev_class = None
    for entry in entries:
        if (comment:= get_slice(entry, 0, '<span class="courselistcomment commentindent">', '</div>', flags=0b11000)) is not None:
            comment, footnotes = get_superscripts(comment); num_comments += 1
            section[f'comment{num_comments}']:table_comment = {'text': clear_html(comment), 'footnotes': footnotes}

        elif (start:= entry.find('class="courselistcomment areaheader')) != -1: # this is not doing being called
            entry, footnotes = get_superscripts(entry)
            if classes['classes'].get(comment:= clear_html(get_slice(entry, start, '>', '<'))) is not None: comment = f'~{comment}'
            num_comments = bool_count = 0
            classes['classes'][comment]:class_dict = {'classes': (section:={}), 'hours': get_hours(entry), 'footnotes': footnotes}
            area = classes['classes'][comment]

        elif (comment:= get_slice(entry, 0, '<span class="courselistcomment">', '</span>', flags=0b11000)) is not None:
            entry, footnotes = get_superscripts(entry)
            if classes['classes'].get(comment:= clear_html(comment)) is not None: comment = f'~{comment}'
            num_comments = bool_count = 0
            area['classes'][comment]:class_dict = {'classes': (section:={}), 'hours': get_hours(entry), 'footnotes': footnotes}

        elif (start:= entry.find('class="codecol orclass">')) != -1: prev_class, bool_count = orclass_handler(entry, start, section, bool_count, prev_class)
        else: prev_class, bool_count = parse_standard(entry, section, prev_class, bool_count)
    return classes
None




if __name__ == '__main__':
    PATH = './current_test_major.html'
    with open(PATH) as f: major_html = f.read()
    classes = parse(major_html)

    import json

    with open("parsed_classes.json", 'w') as f: json.dump(classes, f, indent=4, ensure_ascii=False)




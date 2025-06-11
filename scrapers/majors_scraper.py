import requests
import json
import re
import sys

from time import sleep
import threading
import major_requirements_scraper
import multiprocessing as mp


import traceback

import os
try: os.mkdir("majors")
except: None

catalog_url = 'https://catalog.gmu.edu'
programs_url = '/programs/'

TEST_MAJOR = 'Data Analysis Minor'

lock = [mp.Lock(), mp.Lock(), mp.Lock()]

debug = [open(f'majors_scraper.{tar}.log', 'w') for tar in ['out', 'err']]

def major_parse_wrapper(major, lock, cur, total, d):
    debug = [open(f'majors_scraper.{tar}.log', 'a') for tar in ['out', 'err']]
    __major_parse_wrapper_helper(major, debug, lock, cur, total, d)
    for f in debug: f.close()
    return
None

def __major_parse_wrapper_helper(major, debug, lock, cur, total, d):
    try:


        with lock[2]:
            d[cur] = major['name']
            print(f'started {cur}/{total}')
        None
        r = requests.get(catalog_url+major['url'])


        if major['name'] == TEST_MAJOR:
            with open('./current_test_major.html', 'w') as f: print(r.text, file=f)
       # bar = [None]
        #def foo(bar):
        try:
            requirements = major_requirements_scraper.parse(r.text)
        except Exception as e:
            with lock[1]:
                print(major, file=debug[1])
                traceback.print_exception(type(e), e, e.__traceback__, file=debug[1]); print(file=debug[1]);
            with lock[2]:
                d.pop(cur)
                print(f'errored {cur}/{total}')
            return
      #  t = threading.Thread(target=foo, args=(bar,))
        #t.start(); t.join()
        #requirements = bar[0]
        if requirements is None:
            with lock[1]: print('Failed:', major['name'], file=debug[1]); print(file=debug[1])
            with open('./majors/'+major['name'], 'w') as f: print(r.text, file=f)
            with lock[2]:
                d.pop(cur)
                print(f'closed {cur}/{total}')
            return
        None

        requirements['catagories'] = major['filters']
        with open('./majors/'+major['name'], 'w') as f: json.dump(requirements, fp=f, ensure_ascii=False, indent=4)
        with lock[0]: print('Finished:', major['name'], file=debug[0])
        with lock[2]:
            d.pop(cur)
            print(f'closed {cur}/{total}')
        return

    except Exception as e:
        with lock[1]: traceback.print_exception(type(e), e, e.__traceback__, file=debug[1]); print(file=debug[1]);
        with lock[2]:
            d.pop(cur)
            print(f'errored {cur}/{total}')
        return
None


def get_programs():
    r = requests.get(catalog_url+programs_url)

    filters = {}
    start = r.text.find('class="filter-group"')
    while (start:= r.text.find('<label for="', start)) != -1:
        start += len('<label for="')
        end = r.text.find('">', start)
        filter_name = r.text[start:end]
        start = end+len('">')
        end = r.text.find('</label>', start)
        filters[filter_name] = r.text[start:end].replace('&amp;', '&').strip()
        start = end
    None

    def filter_decoder(d: dict):
        if 'filters' in d: d['filters'] = [filters[filt] for filt in d['filters']]
        if 'id' in d: d.pop('id')
        if 'name' in d:
            if '/' in d['name']: d['name'] = d['name'].replace('/', '⁄')
        return d
    None

    data_start = r.text.find('var allitemsData = ') + len('var allitemsData = ')
    data_end = r.text.rfind('</script>', data_start)-2
    data = re.sub(r'(\s)(\w*):', r'\1"\2":', r.text[data_start:data_end]).replace('\\', '∖') # we replace \ with a lookalike
    data = re.sub('(?<=:")(.*)"(.*)"(.*)"', r'\1\"\2\"\3"', data)

    data = json.loads(data, object_hook=filter_decoder)
    # with open('test.json', 'w') as f: json.dump(data, f, ensure_ascii=False, indent=4)
    #  threads = []

    with mp.Manager() as manager:
        d = manager.dict()

        total = len(data)
        cur = 0
        processes = []
        for major in data.values():
            if major['name'] == 'Advanced Biomedical Sciences Graduate Certificate': continue # this page is in a completely different format
            cur += 1
            with lock[0]: print('Started:', major['name'], file=debug[0])
            processes.append(mp.Process(target=major_parse_wrapper, args=(major, lock, cur, total, d,)))
            processes[-1].start()
        None

        for p in processes: p.join()
        print(d)
        with open('test.json', 'w') as f: json.dump(dict(d), fp=f, ensure_ascii=False, indent=4)
        #for p in processes: p.kill(); p.join()


    """
    for major in data.values():
        print('Started:', major['name'])
        t = threading.Thread(target=major_parse_wrapper, args=(major,))
        threads.append(t)
        t.start()
       # loop = False
    None

    for t in threads: t.join() """
None

get_programs()
for f in debug: f.close()

"""Regression contract: retain original homepage wording, order and combined events."""
from pathlib import Path
from html.parser import HTMLParser
import json,re
ROOT=Path(__file__).resolve().parent.parent
class Text(HTMLParser):
 def __init__(self):super().__init__();self.text=[]
 def handle_data(self,d):self.text.append(d)
def plain(s):
 p=Text();p.feed(s);return re.sub(r'\s+',' ',' '.join(p.text)).strip()
page=(ROOT/'site/index.html').read_text()
contract=json.loads((ROOT/'src/original-home-content.json').read_text())
body=plain(page)
for value in contract['required_text']:
 assert value in body, f'Original text missing: {value}'
headings=re.findall(r'<h2[^>]*>(.*?)</h2>',page,re.S)
assert [plain(x) for x in headings]==contract['section_order'],[plain(x) for x in headings]
header=re.search(r'<header class="race-nav".*?</header>',page,re.S)[0]
assert 'Namaz' not in header and 'prayer' not in header
menu=re.search(r'<dialog class="race-dialog".*?</dialog>',page,re.S)[0]
assert 'Namaz Timings' in menu
assert page.count('class="event-journey"')==1
assert page.count('class="journey-card"')==5
assert 'data-featured-programme="exploring-surah-hadid"' in page
assert 'community-brothers' not in page and 'community-sisters' not in page
assert 'mosque/brothers' not in page and 'mosque/sisters' not in page
assert 'السلام عليكم' in page
assert 'friday-chai.jpeg' not in page and 'surah-hadid.jpeg' not in page
assert len(re.findall(r'data-solar-time=',page))==6
for name in ['gsap','ScrollTrigger','SplitText','Flip','DrawSVGPlugin','Observer','MotionPathPlugin','CustomEase','ScrollToPlugin','Draggable']:
 assert f'vendor/{name}.min.js' in page
assert 'assets/js/experience.js' in page
assert 'assets/js/motion.js' not in page
palestine=(ROOT/'site/palestine/index.html').read_text()
assert 'https://donate.unrwa.org/int/en/gaza' in palestine
assert 'https://www.unrwa.org/resources/emergency-appeals/' in palestine
print(f'PASS: original homepage content contract ({len(contract["required_text"])} passages), section order, menu placement, combined events, bundled motion and donation destination.')

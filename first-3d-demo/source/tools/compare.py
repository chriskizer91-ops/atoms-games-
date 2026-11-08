from PIL import Image, ImageDraw, ImageFont
import sys, os
os.chdir('/home/claude/cc3d/test')
def sheet_row(path, kind):
    im=Image.open(path).convert('RGB')
    if kind=='grid':
        w,h=im.size; cw,ch=w//3,h//2
        cells=[im.crop((c*cw,r*ch,(c+1)*cw,(r+1)*ch)) for (c,r) in [(0,0),(1,0),(2,0),(0,1),(1,1)]]
    else:
        n=6 if 'turnaround-juniper' in path else 5
        w,h=im.size; cw=w//n
        cells=[im.crop((i*cw,0,(i+1)*cw,h)) for i in range(5)]
    H=max(c.height for c in cells); row=Image.new('RGB',(sum(c.width for c in cells),H),(255,0,255))
    x=0
    for c in cells: row.paste(c,(x,0)); x+=c.width
    return row
def montage(items, out, W=1500):
    rows=[]
    font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 28)
    for name, sheet, kind in items:
        a=sheet_row(sheet, kind); a=a.resize((W, int(a.height*W/a.width)))
        b=Image.open(f'turn_{name}.png').convert('RGB'); b=b.resize((W, int(b.height*W/b.width)))
        lab=Image.new('RGB',(W,44),(40,34,56)); d=ImageDraw.Draw(lab); d.text((14,6), name.replace('-',' ').title()+':  your sheet (top),  3D model (bottom)', fill=(255,244,216), font=font)
        rows += [lab, a, b]
    H=sum(r.height for r in rows); img=Image.new('RGB',(W,H),(40,34,56)); y=0
    for r in rows: img.paste(r,(0,y)); y+=r.height
    img.save(out, quality=88); print(out, img.size)
S='/home/claude/sheets/'
montage([('drizzlon',S+'p1/turnaround-drizzlon.png','grid'),('mossback',S+'p1/turnaround-mossback.png','grid'),('embroak',S+'p1/turnaround-embroak.png','grid'),('clovermouse',S+'p1/turnaround-clovermouse.png','grid'),('hopsprout',S+'p1/turnaround-hopsprout.png','grid')], 'compare-creatures.jpg')
montage([('player-a',S+'p1/turnaround-player-a.png','row'),('player-b',S+'p1/turnaround-player-b.png','row'),('juniper',S+'p1/turnaround-juniper.png','row'),('willow',S+'p2/turnaround-willow.png','row')], 'compare-people.jpg')

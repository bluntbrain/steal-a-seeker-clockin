from pathlib import Path
import json, shutil

root=Path(__file__).resolve().parents[1]
old=root/'verification/campaign-audit-v5'
new=root/'verification/campaign-balance-v5'
before=json.loads((old/'report.json').read_text())
after=json.loads((new/'report.json').read_text())
out=root/'design/visual-v2/campaign-balance';out.mkdir(parents=True,exist_ok=True)
changes={3:'Reinforcements: 2.2 / 4.4 → 3.5 / 5.7 s',5:'Reinforcements: 2.2 / 4.4 → 4 / 7 s',7:'Reinforcements: 2.2 / 4.4 / 6.6 → 4 / 6.2 / 8.4 s',10:'Upper sentry stops before the Heavy crossing',11:'Right sentry stops one tile before the middle crossing',12:'Heavy moves across the middle aisle; scout keeps the lower lane'}
assessment={3:('Improved','The reference route leaves 60 HP rather than 20. Mildly delayed plans improve from 0/24 to 22/24, but basic shooting stays at 11/48.','Test whether new players can use the larger escape window without memorizing the route.'),5:('Still a spike','The reference leaves 35 HP rather than 10. Basic shooting improves only from 0/48 to 2/48; both delayed-plan groups still fail.','A longer reinforcement delay helps, but does not resolve the escape spike. Review the upper firing lanes with phone playtests.'),7:('Unresolved','Reference health stays at 25 HP. Basic shooting and delayed-plan trials still have zero wins. A timing delay alone did not solve this map.','Next experiment: separate the guards covering the phone bay, then repeat the same audit.'),10:('Still harsh','Reference health rises from 20 to 40 HP. Only 1/24 mildly delayed plans clears; basic shooting remains 0/48.','Keep the verified patrol separation, then test the approach and timed exit with people.'),11:('Improved, still hard','Reference health rises from 30 to 58 HP; mildly delayed plans improve from 0/24 to 13/24. Basic shooting remains 0/48.','The route has more timing tolerance. Test whether players can discover it without help.'),12:('Still harsh','Reference health rises from 15 to 33 HP, but the winning route is longer. Basic shooting still dies before pickup in every trial.','The opening remains the problem. Test a reduced early Heavy sightline before changing the final Warden encounter.')}
old_view=json.loads((root/'design/visual-v2/campaign-audit/data.json').read_text())
payload=[]
wins=lambda r:r['profiles']['reactive']['wins']+r['profiles']['slow']['wins']
for b,a,prior in zip(before['levels'],after['levels'],old_view['levels']):
    n=a['number'];detail=json.loads((new/f'{n:02}-{a["id"]}.json').read_text())
    label,reason,next_step=assessment.get(n,('Unchanged','Same rules, geometry and trial results as the baseline.',prior['report']['judgment']['experiment']))
    a['before']={'hp':b['solution']['hp'],'seconds':b['solution']['seconds'],'shooting':wins(b),'mild':b['profiles']['mild']['wins']}
    a['change']=changes.get(n,'Unchanged')
    a['judgment']={'pressure':prior['report']['judgment']['pressure'],'label':label,'reason':reason,'experiment':next_step,'action':label}
    payload.append({'report':a,**detail})
    if n not in changes:
        assert b['profiles']==a['profiles'] and b['solution']==a['solution'],f'Untargeted mission {n} changed'
        assert json.loads((old/f'{n:02}-{a["id"]}.json').read_text())['level']==detail['level']
assert after['totalTrials']==1296 and after['campaign']['completedMissions']==12
assert all(x['spawnIdle']['hp']==100 for x in after['levels'])

md=['# Campaign balance retest — 17 September 2026','',
'All 12 maps remain solvable. The targeted changes improve the reference escapes in 3, 5 and 10–12. Level 7 is still a problem; delaying its reinforcements did not materially improve these trial results. Do not describe the campaign as fully balanced yet.','',
f'Baseline rules: `{before["rules"]["rulesHash"]}`. Retest rules: `{after["rules"]["rulesHash"]}`.',
f'Run generated: {after["generatedAt"]}. Based on commit `{after["commit"]}` plus the balance patch identified by the retest rules hash.','',
'## Before and after','',
'HP is from a verified reference escape, not a human average. Shooting combines 24 basic and 24 slower-controller trials. Mild delay means 24 perturbed versions of the reference plan.','',
'| Mission | Change | Reference HP before → after | Shooting wins before → after /48 | Mild-delay wins before → after /24 | Assessment |',
'|---|---|---:|---:|---:|---|']
for r in after['levels']:
    b=r['before'];md.append(f'| {r["number"]:02} {r["title"]} | {r["change"]} | {b["hp"]} → {r["solution"]["hp"]} | {b["shooting"]} → {wins(r)} | {b["mild"]} → {r["profiles"]["mild"]["wins"]} | {r["judgment"]["label"]} |')
md+=['','## What changed','',
'- Level 3: first reserve arrives 1.3 seconds later; the second keeps its 2.2-second spacing.',
'- Level 5: waves arrive at 4 and 7 seconds after alarm.',
'- Level 7: waves arrive at 4, 6.2 and 8.4 seconds after alarm.',
'- Level 10: upper sentry moves between (1.5, 3.5) and (1.5, 1.5), leaving the Heavy crossing at y=4.5.',
'- Level 11: right sentry turns at y=6.5, before the middle crossing at y=7.5.',
'- Level 12: Heavy patrol moves from (4.5, 10.5) to (6.5, 10.5); the scout retains the lower vertical lane.',
'- Walls, colors, enemy health, damage, movement speed, phone positions and mission timers remain unchanged.',
'','## Verification','',
'- 1,296 controlled trials rerun with the same seeds and controller policies. Every result matches local server replay verification.',
'- Winning command sequence for all 12 maps, with mission completion, unlock, save serialization and reload.',
'- All eight tutorial steps still complete with 100 HP.',
'- Eight seconds of idle input at every spawn still leaves 100 HP.',
'- Geometry checks pass for patrol segments, objectives, gated routes and alternate cover routes.',
'- Untargeted missions 1, 2, 4, 6, 8 and 9 have exactly identical map definitions, reference outcomes and profile summaries.',
'- App tests: 153 passed. Backend integration tests against the local test database: 66 passed. TypeScript and generated-rules checks pass.',
'- Frozen active-week compatibility: all three live map definitions have the same complete verifier outcomes in the current and archived engine, across six start-delay variants each. Live runs were not submitted.',
'','## Limits and next decisions','',
'These are automated simulations, not human win rates or a complete manual phone playthrough. The reference solver can simulate future outcomes. Basic controllers do not intelligently dodge bursts. Delayed plans do not replan. The solver recomputes its winning route after a change, so the before/after HP figures compare two reference solutions, not necessarily identical tap sequences.',
'',
'Two alternative patrol placements failed the winning-route search and were rejected. Failure to find a route does not prove impossibility; there was no reason to ship a candidate without a verified win.',
'']
for n,(label,reason,next_step) in assessment.items():md += [f'### Mission {n}: {label}','',reason,'',next_step,'']
md+=['## Weekly maps','',
'The native app downloads the backend’s frozen weekly map definitions. This update separates engine compatibility from campaign layout changes. The current week remains unchanged; new weeks store an engine fingerprint.',
'',
'The current generator still remixes a small layout family. It does not create three newly designed dense maps each week. See `docs/WEEKLY-MAP-AUTOMATION.md` for the current flow and proposed validated template/pack pipeline.',
'','## Reproduce','',
'```sh\nnpm run rules:generate\nAUDIT_OUTPUT_DIR=verification/campaign-balance-v5 ./node_modules/.bin/tsx scripts/audit-campaign-v5.ts\npython3 scripts/build-balance-report.py\n```','',
'Evidence: `verification/campaign-balance-v5/report.json` and the 12 map/replay files beside it. The original audit remains in `verification/campaign-audit-v5/`.','']
(root/'docs/CAMPAIGN-BALANCE-RETEST-V5.md').write_text('\n'.join(md))
(out/'report.md').write_text('\n'.join(md));shutil.copyfile(new/'report.json',out/'raw-results.json')
shutil.copyfile(root/'docs/WEEKLY-MAP-AUTOMATION.md',out/'weekly-maps.md')
(out/'data.json').write_text(json.dumps({'report':after,'levels':payload},separators=(',',':')))

template=(root/'design/visual-v2/campaign-audit/index.html').read_text()
template=template.replace('Difficulty audit','Balance retest').replace('MAPS V5 / BALANCE REPORT','MAPS V5 / BEFORE & AFTER')
start=template.index('<header>');end=template.index('<section id="viewer">')
template=template[:start]+'''<header><span class="kicker">STEAL A SEEKER / BALANCE RETEST</span><h1>More room to escape.<br>Still too harsh in places.</h1><p class="lead">Six targeted changes. All 12 missions remain solvable. Mission 3 is more forgiving; mission 7 still needs work. The late-game patrol changes help the reference routes, but do not yet produce a fair curve for basic play.</p><div class="callout">1,296 automated trials. These are controller outcomes, not human win rates. A full phone playtest is still needed.</div></header>
<div class="stats"><div class="stat"><strong>12 / 12</strong><span>Verified escapes and progress saves</span></div><div class="stat"><strong>20 → 60</strong><span>Mission 3 reference HP</span></div><div class="stat"><strong>30 → 58</strong><span>Mission 11 reference HP</span></div><div class="stat"><strong>07</strong><span>Still an unresolved escape spike</span></div></div>
<div class="links"><a class="button" href="report.md">Full comparison</a><a class="button" href="weekly-maps.md">How weekly maps work</a><a class="button" href="../campaign-audit/index.html">Original audit</a><a class="button" href="/?build=balance-retest">Play updated game</a></div>
<section><h2>Before → after</h2><p>Each side uses the same trial counts and controller policies. The reference solver finds a route for each version. Select a row to watch the new winning replay.</p><div class="table-wrap"><table><thead><tr><th>Mission</th><th>Reference HP</th><th>Shooting wins /48</th><th>Mild-delay wins /24</th><th>Assessment</th></tr></thead><tbody id="table"></tbody></table></div></section>
'''+template[end:]
start=template.index('<div class="box"><h2>What to change next</h2>');end=template.index('</div></section>',start)
template=template[:start]+'''<div class="box"><h2>Next: deliberate weekly maps</h2><ol><li>The phone keeps the engine and artwork.</li><li>The backend sends the same three map recipes to everyone.</li><li>Monday reset is already automatic: 00:00 UTC / 05:30 India.</li><li>Today’s generator mostly remixes one layout family.</li><li>Build a tested template bank and approve packs ahead of time. Publish each pack once; never change the active week.</li></ol><a href="weekly-maps.md">Read the implementation plan</a>'''+template[end:]
(out/'index.html').write_text(template)
js=(root/'design/visual-v2/campaign-audit/viewer.js').read_text().replace("i.src=name+'-cap.jpg'","i.src='../campaign-audit/'+name+'-cap.jpg'")
start=js.index(" $('table').innerHTML=");end=js.index("\n $('table').querySelectorAll",start)
js=js[:start]+''' $('table').innerHTML=d.levels.map(({report:r},i)=>'<tr data-level="'+i+'"><td><b>'+String(i+1).padStart(2,'0')+' · '+r.title+'</b></td><td>'+r.before.hp+' → '+r.solution.hp+'</td><td>'+r.before.shooting+' → '+(r.profiles.reactive.wins+r.profiles.slow.wins)+'</td><td>'+r.before.mild+' → '+r.profiles.mild.wins+'</td><td>'+r.judgment.label+'</td></tr>').join('');'''+js[end:]
js=js.replace('ONE PROPOSED EXPERIMENT','NEXT TEST').replace('Balance changes: none.','Balance changes: missions 3, 5, 7 and 10–12.').replace("'Audited commit '","'Base commit '")
(out/'viewer.js').write_text(js)
print('Built balance comparison, replay viewer and weekly architecture report.')

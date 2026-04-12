// ═══════════════════════════════════════════════════════
// THE CAROUSEL CAPER
// Mystery at Adventure World
// An award-winning detective narrative
// Powered by inkle's Ink
// ═══════════════════════════════════════════════════════

VAR clues_found = 0
VAR suspects_questioned = 0
VAR wendy_confronted = false
VAR pete_confronted = false
VAR twist_revealed = false
VAR has_glitter = false
VAR has_bolt = false
VAR has_cameras = false
VAR has_dolly = false
VAR has_labcoat_witness = false
VAR has_two_people = false
VAR has_wendy_searches = false
VAR has_wendy_lights = false
VAR has_pete_log = false
VAR has_pete_blueprints = false
VAR has_pete_payment = false
VAR has_janet_alibi = false
VAR has_teddy_snacks = false
VAR has_wendy_receipt = false
VAR has_wendy_shipping = false
VAR has_dock_manifest = false
VAR accused = ""
VAR accomplice = ""

-> intro

=== intro ===
# LOCATION: main_plaza
# MOOD: dramatic

🔍 <b>MYSTERY AT ADVENTURE WORLD</b>
<i>The Carousel Caper</i>

It was supposed to be a perfect day at Adventure World. The sun was shining, the cotton candy was flowing, and the new summer season was off to a record-breaking start.

But when Head Groundskeeper Martha Wiggins arrived at 6 AM to polish the famous Golden Horse on the Grand Carousel, she found an empty pole where the 200-pound golden stallion should have been.

The Golden Horse wasn't just any decoration — it was Adventure World's mascot, hand-crafted by the park's founder 40 years ago and worth an estimated <b>$2 million</b>.

Park Director Theodore "Teddy" Pemberton III called an emergency meeting. <i>"Nobody leaves this park until we find that horse,"</i> he declared, adjusting his bow tie nervously. <i>"And somebody get me a detective!"</i>

That's where you come in.

+ [Begin Investigation →] -> hub

=== hub ===
# LOCATION: park_map

📍 <b>ADVENTURE WORLD — INVESTIGATION HUB</b>
Clues found: {clues_found}. Suspects questioned: {suspects_questioned}.
{twist_revealed: 🔴 TWIST REVEALED — New evidence available!}

Where would you like to go?

+ [🎠 Grand Carousel — Crime Scene] -> carousel
+ [🔧 Maintenance Tunnels] -> tunnels
+ [🏢 Wendy's Office] -> wendys_office
+ [⚙️ Pete's Workshop] -> petes_workshop
+ [🍳 Janet's Kitchen] -> janets_kitchen
+ [🎪 Security Desk] -> security_desk
+ [📦 Shipping Dock] -> shipping_dock
+ {clues_found >= 3} [🕵️ Interrogate a Suspect] -> choose_suspect
+ [📋 Review Evidence Board] -> evidence_board
+ {clues_found >= 8} [🗳️ Ready to Accuse!] -> accusation

=== carousel ===
# LOCATION: carousel

🎠 <b>THE GRAND CAROUSEL</b>

The carousel stands eerily silent. Morning light catches the empty brass pole where the Golden Horse once stood. The other carousel animals seem to stare at the gap, as if they know something.

{not has_glitter:
    You kneel down and notice something...
    
    🔬 <b>EVIDENCE FOUND:</b> A trail of golden glitter leads from the empty pole toward the maintenance tunnels. On closer inspection, it's <i>flaking paint</i>, not decorative glitter. The horse was dragged.
    ~ has_glitter = true
    ~ clues_found++
}

{has_glitter and not has_bolt:
    You examine the mounting mechanism...
    
    🔬 <b>EVIDENCE FOUND:</b> The security bolt was unscrewed with precision tools — every thread intact. This was <i>not</i> a smash-and-grab. Whoever did this knew exactly what they were doing.
    ~ has_bolt = true
    ~ clues_found++
}

{has_bolt and not has_labcoat_witness:
    A nervous maintenance worker approaches you.
    
    <i>"Excuse me, detective? I wasn't here last night, but Old Earl on the night shift... he mentioned seeing someone in a <b>white lab coat</b> near the carousel around 11 PM. Said they were carrying what looked like tools."</i>
    
    👁️ <b>WITNESS STATEMENT:</b> Person in lab coat spotted at carousel, 11 PM, carrying tools.
    ~ has_labcoat_witness = true
    ~ clues_found++
}

{has_glitter and has_bolt and has_labcoat_witness:
    You've thoroughly examined the crime scene. The glitter trail leads toward the tunnels...
}

+ [← Back to Map] -> hub

=== tunnels ===
# LOCATION: tunnels

🔧 <b>MAINTENANCE TUNNELS</b>

Dark, damp corridors stretch beneath Adventure World. Pipes hum overhead. Your flashlight catches dust motes floating in the stale air.

{not has_dolly:
    Against the wall, you notice an empty space with wheel marks on the floor...
    
    🔬 <b>EVIDENCE FOUND:</b> A large industrial dolly cart is missing from its charging station. The label reads: "RATED FOR 300 LBS." Someone needed to move something <i>very</i> heavy.
    ~ has_dolly = true
    ~ clues_found++
}

{has_labcoat_witness and not has_two_people:
    A night-shift tunnel worker shuffles toward you.
    
    <i>"Detective? Yeah, I was down here around midnight. Saw <b>two people</b> movin' through the south corridor. Couldn't see faces — too dark down here. But definitely two of 'em. One was pushin' something on wheels."</i>
    
    👁️ <b>WITNESS STATEMENT:</b> TWO people seen in tunnels at midnight, one pushing wheeled object.
    ~ has_two_people = true
    ~ clues_found++
    
    Two suspects working together. This changes everything.
}

+ [← Back to Map] -> hub

=== wendys_office ===
# LOCATION: office

🏢 <b>WENDY'S OFFICE</b>

Widget Wendy Wu's office is immaculate. Color-coded folders, a label maker, and a neat row of miniature carousel horses on her desk. Everything screams <i>control freak</i>.

{ not has_wendy_searches:
    Her company tablet sits on the desk, screen still unlocked...
    -> wendy_tablet_choice
- else:
    -> wendy_office_clues
}

= wendy_tablet_choice
+ [Search her tablet]
    You swipe through her recent activity...
    
    💭 <b>MOTIVE FOUND:</b> Recent browser searches include <i>"international antique shipping rates,"</i> <i>"golden horse value estimate,"</i> and <i>"private art collector contacts."</i>
    ~ has_wendy_searches = true
    ~ clues_found++
    
    Why would the Head of Merchandise be researching <i>private</i> art collectors?
    -> wendy_office_clues
    
+ [Leave it — look around the office instead]
    You respect her privacy... for now. A good detective might come back.
    -> wendy_office_clues

= wendy_office_clues
{ has_wendy_searches and not has_wendy_lights:
    You pull up the hallway security footage on the desk monitor...
    
    🔬 <b>EVIDENCE FOUND:</b> Wendy's office lights went dark at 10:03 PM. Her keycard wasn't used to re-enter until 6:47 AM. She claims she was working until 2 AM.
    ~ has_wendy_lights = true
    ~ clues_found++
    
    <b>Her alibi just cracked wide open.</b>
}

{ twist_revealed and not has_wendy_receipt:
    Now that you know about the replica, you search her desk more carefully...
    
    In a locked drawer (the lock is cheap — one paperclip does the trick):
    
    🔬 <b>CRITICAL EVIDENCE:</b> A receipt from "Master Sculptors LLC" for <i>"custom equine figure, gold finish, life-size"</i> — ordered <b>3 WEEKS AGO</b>.
    ~ has_wendy_receipt = true
    ~ clues_found++
    
    She ordered the replica <i>before</i> the theft. This was planned for weeks.
}

{ twist_revealed and has_wendy_receipt and not has_wendy_shipping:
    Behind a stack of binders, you find a FedEx envelope...
    
    🔬 <b>CRITICAL EVIDENCE:</b> International shipping receipt. Contents: <i>"Decorative art piece, 200 lbs."</i> Destination: private address in Monaco. Shipped <b>2 WEEKS AGO</b>. Signed by: <b>W. Wu</b>.
    ~ has_wendy_shipping = true
    ~ clues_found++
    
    The real horse was shipped overseas <i>before</i> last night's "theft." The timeline changes everything.
}

+ [← Back to Map] -> hub

=== petes_workshop ===
# LOCATION: workshop

⚙️ <b>PETE'S WORKSHOP</b>

Professor Peculiar Pete's workshop is controlled chaos — half-finished inventions, coffee-stained blueprints, and a suspicious number of empty energy drink cans. A whiteboard reads: "WHIRLIGIG 3000 — ALMOST THERE!"

{not has_pete_log:
    The electronic door log catches your eye...
    
    🔬 <b>EVIDENCE FOUND:</b> Workshop access log shows Pete <b>exited at 9:02 PM</b> and didn't badge back in until <b>3:17 AM</b>. That's a <b>6-hour gap</b> completely unaccounted for.
    ~ has_pete_log = true
    ~ clues_found++
    
    Where does a park engineer go for 6 hours in the middle of the night?
}

{twist_revealed and not has_pete_blueprints:
    Among his messy blueprints, one drawing stands out — it's cleaner, more precise than the others...
    
    🔬 <b>CRITICAL EVIDENCE:</b> Detailed engineering blueprints for a <i>"Precision Carousel Figure Extraction System"</i> — a custom tool designed specifically to remove a carousel horse from its mounting pole without damage.
    ~ has_pete_blueprints = true
    ~ clues_found++
    
    His "invention" wasn't the Whirligig 3000. It was a <b>theft tool</b>.
}

{twist_revealed and has_pete_blueprints and not has_pete_payment:
    You check Pete's financial records on his workshop computer (password: "whirligig3000")...
    
    💭 <b>MOTIVE FOUND:</b> Bank statement shows a <b>$50,000 deposit</b> from <i>Wendy Wu's personal account</i> last month. Memo line: "Research funding."
    ~ has_pete_payment = true
    ~ clues_found++
    
    Wendy <b>paid</b> Pete to help her. They're partners in this.
}

+ [← Back to Map] -> hub

=== janets_kitchen ===
# LOCATION: kitchen

🍳 <b>JANET'S KITCHEN</b>

The kitchen smells incredible — funnel cakes, cinnamon, and something savory simmering in an enormous pot. Jolly Janet's domain is warm and inviting, a stark contrast to a crime scene.

{not has_janet_alibi:
    Kitchen staff are chatting by the coffee machine...
    
    <i>"Janet? Oh, she left around 8 PM. Said the sauce base was done and she'd be back in the morning. Nobody saw her after that."</i>
    
    👁️ <b>WITNESS STATEMENT:</b> Janet claims she was stirring sauce all night, but staff confirm she left at 8 PM.
    ~ has_janet_alibi = true
    ~ clues_found++
    
    Her alibi doesn't hold up. But is she really the type to steal a 200-pound horse?
}

{not has_janet_alibi:
    + [Ask about the sauce recipe]
        <i>"Oh, that recipe? Janet guards it with her life. Funny thing — she said she left a copy somewhere and couldn't find it yesterday morning."</i>
        
        📌 A missing recipe copy... probably nothing, but noted.
        -> janets_kitchen_end
    + [Look around the kitchen]
        -> janets_kitchen_end
}

- (janets_kitchen_end)
+ [← Back to Map] -> hub

=== security_desk ===
# LOCATION: security

🎪 <b>SECURITY DESK</b>

Banks of monitors show feeds from across the park. Most are working normally. One screen shows static — the carousel camera.

{not has_cameras:
    🔬 <b>EVIDENCE FOUND:</b> The carousel camera was <b>manually disabled</b> at 9:58 PM and didn't come back online until 2:14 AM. The disable command came from <i>inside the security system</i> — someone with admin access.
    ~ has_cameras = true
    ~ clues_found++
}

{has_wendy_lights and has_pete_log and not has_teddy_snacks:
    Wait... you cross-reference the camera disable timestamp with the suspect timelines. Something doesn't add up.
    
    The disable happened at 9:58 PM — <i>before</i> Wendy left her office and before Pete left his workshop. Neither of them could have done it.
    
    You dig deeper into the admin logs...
    
    🔬 <b>EVIDENCE FOUND:</b> Camera disabled by admin account: <b>T_PEMBERTON</b>. Cross-referencing with the kitchen logs... Teddy's keycard accessed the staff kitchen at 10:15 PM, 11:42 PM, and 1:03 AM.
    
    <i>Teddy disabled the cameras to sneak midnight kitchen snacks.</i> His wife monitors his diet through the park cameras. He was hiding his eating, not a theft! 😄
    ~ has_teddy_snacks = true
    ~ clues_found++
    
    <b>Secondary Mystery SOLVED:</b> The camera shutdown was Teddy's diet cheating, completely unrelated to the horse theft!
}

+ [← Back to Map] -> hub

=== shipping_dock ===
# LOCATION: dock

📦 <b>SHIPPING DOCK</b>

The loading dock handles all deliveries and shipments for Adventure World. Stacks of crates, a clipboard on the wall, and tire marks on the concrete.

{not has_dock_manifest and not has_wendy_shipping:
    You check the recent manifests...
    
    Nothing unusual in the last few days. Standard supply deliveries, merchandise shipments.
    
    📌 Might be worth coming back if you find a reason to look further back in the records.
}

{has_wendy_shipping and not has_dock_manifest:
    Knowing about the overseas shipment, you dig through manifests from 2 weeks ago...
    
    🔬 <b>CRITICAL EVIDENCE:</b> Dock manifest, dated 14 days ago: <i>"Outbound shipment. 1x crated item, 200 lbs. Private courier pickup. Signed by: <b>W. Wu, Head of Merchandise</b>."</i>
    
    The dock worker confirms: <i>"Yeah, I remember that one. She said it was a promotional display being returned to the manufacturer. Seemed normal."</i>
    ~ has_dock_manifest = true
    ~ clues_found++
    
    The real Golden Horse left this dock <b>two weeks ago</b>, disguised as a routine shipment.
}

+ [← Back to Map] -> hub

=== choose_suspect ===
# LOCATION: interrogation

🕵️ <b>INTERROGATION ROOM</b>

Who would you like to question?

+ [🎠 Dizzy Dave — Carousel Operator] -> interrogate_dave
+ [💼 Widget Wendy — Head of Merchandise] -> interrogate_wendy
+ [⚙️ Professor Peculiar Pete — Engineer] -> interrogate_pete
+ [🍳 Jolly Janet — Head Chef] -> interrogate_janet
+ [🎩 Teddy Pemberton III — Director] -> interrogate_teddy
+ [← Back to Map] -> hub

=== interrogate_dave ===
~ suspects_questioned++

Dizzy Dave sits across from you, wringing his paint-stained hands. His eyes are red — he's been crying.

<i>"I would NEVER hurt my babies! That horse is <b>family</b>!"</i>

+ [Where were you last night?]
    <i>"Sunset Lanes! Bowling! I bowled a 180 — my personal best! Ask anyone!"</i>
    
    {has_janet_alibi:
        You recall: the bowling alley closes at 11 PM...
        
        + + [🔥 The bowling alley closes at 11 PM, Dave. Where were you after?]
            Dave's face crumbles.
            
            <i>"I... okay. I drove back to the park. I parked outside and just... sat there. Looking at the carousel through the fence. They're replacing my horse with a modern replica. After twenty years! I was saying goodbye."</i>
            
            His voice breaks. <i>"I fell asleep in my car. Woke up at 5 AM. I swear on my mother, I didn't take that horse."</i>
            
            📌 His alibi has a gap, but his grief seems genuine. This man loves that horse — he wouldn't destroy it by stealing it.
            -> choose_suspect
            
        + + [Interesting. I'll note that.] -> choose_suspect
    }
    -> choose_suspect

+ [Tell me about the replacement plans.]
    <i>"They want to put in some FIBERGLASS MONSTROSITY. After twenty years of me polishing that horse every single morning! That horse has a <b>soul</b>, detective."</i>
    
    He pulls out a wallet photo — it's him hugging the Golden Horse.
    
    📌 Deeply emotional, but more likely to chain himself to the carousel in protest than steal from it.
    -> choose_suspect

+ [← Back] -> choose_suspect

=== interrogate_wendy ===
~ suspects_questioned++

Widget Wendy sits perfectly still, tablet in hand, expression unreadable.

<i>"A terrible loss for the brand. I've already drafted a memo about replacement merchandise options."</i>

+ [Where were you last night?]
    <i>"In my office until approximately 2 AM. Inventory season, you know. The security cameras can confirm I was in the building."</i>
    
    {has_wendy_lights:
        + + [🔥 CONFRONT: Your office lights were OFF after 10 PM, Wendy. The cameras show a dark room.]
            ~ wendy_confronted = true
            
            For the first time, her composure cracks. Just slightly.
            
            <i>"I... prefer to work with natural moonlight. It's better for my eyes. And I had my laptop screen."</i>
            
            📌 Moonlight at 2 AM in an interior office? That's the weakest excuse you've ever heard. <b>She's lying.</b>
            -> choose_suspect
            
        + + [That must be exhausting work.] -> choose_suspect
    }
    -> choose_suspect

+ {has_wendy_searches} [Why were you researching international antique shipping?]
    A micro-expression of surprise crosses her face before the mask returns.
    
    <i>"Market research. We were exploring a partnership with international collectors for licensed merchandise. Standard business development."</i>
    
    📌 "Licensed merchandise" doesn't require searching for private collector contacts. She's covering something.
    -> choose_suspect

+ [What do you think happened?]
    <i>"Clearly an inside job. Someone with maintenance tunnel access and knowledge of the security systems. I'd look closely at the engineering department."</i>
    
    📌 She's redirecting suspicion toward Pete. Interesting — is she deflecting, or genuinely suspicious of him?
    -> choose_suspect

+ [← Back] -> choose_suspect

=== interrogate_pete ===
~ suspects_questioned++

Professor Pete bounces in his chair, wild hair even wilder than usual.

<i>"Fascinating case! The engineering required to remove a 200-pound figure without triggering any structural alarms... purely hypothetically, of course! One would need a custom extraction apparatus with — oh, am I saying too much?"</i>

+ [Where were you last night?]
    <i>"Calibrating my Whirligig 3000! Science never sleeps, detective!"</i>
    
    {has_pete_log:
        + + [🔥 CONFRONT: Your workshop log shows you LEFT at 9 PM and didn't return until 3 AM. Six hours, Pete.]
            ~ pete_confronted = true
            
            He tugs at his collar.
            
            <i>"Well, yes, I took an... extended constitutional. A walk! For inspiration. The creative process requires fresh air and... movement. Six hours of very productive walking."</i>
            
            📌 A 6-hour midnight walk? In a theme park? He can't even keep a straight face while saying it.
            -> choose_suspect
            
        + + [Must be fascinating work.] -> choose_suspect
    }
    -> choose_suspect

+ {twist_revealed and has_pete_blueprints} [🔥 CONFRONT: Explain these blueprints for a "Carousel Figure Extraction System."]
    ~ pete_confronted = true
    
    Pete's face goes white.
    
    <i>"That's... a theoretical exercise! Academic! I was exploring the physics of... large object removal... for a paper I'm writing. It has NOTHING to do with—"</i>
    
    He stops. Swallows hard.
    
    <i>"I want a lawyer."</i>
    
    📌 <b>He just asked for a lawyer.</b> Guilty people ask for lawyers.
    -> choose_suspect

+ [← Back] -> choose_suspect

=== interrogate_janet ===
~ suspects_questioned++

Jolly Janet enters laughing — she always enters laughing.

<i>"HA HA HA! Is this about the horse? Who steals a HORSE? That's the funniest thing I've ever — wait, it's really gone? For real?"</i>

+ [Where were you last night?]
    <i>"My kitchen! Stirring my famous 14-hour special sauce! It needs CONSTANT attention!"</i>
    
    {has_janet_alibi:
        + + [🔥 Your staff says you left at 8 PM, Janet.]
            <i>"HA HA... okay, yes, I stepped out. I had a date! Don't tell anyone — I'm trying to keep my personal life private. But I came back at midnight to check the sauce! I have a timer on my phone!"</i>
            
            📌 She has a date alibi she's embarrassed about. Probably verifiable. Not a criminal mastermind.
            -> choose_suspect
            
        + + [Dedication!] -> choose_suspect
    }
    -> choose_suspect

+ [← Back] -> choose_suspect

=== interrogate_teddy ===
~ suspects_questioned++

Teddy mops his forehead with a monogrammed handkerchief. His bow tie is slightly askew — unprecedented.

<i>"This is a DISASTER! An absolute CATASTROPHE! Do you have ANY idea what this does to our Q3 projections?!"</i>

+ [Where were you last night?]
    <i>"The Mayor's Charity Gala! Until 11 PM! TWO HUNDRED witnesses saw me there! I have photos! I have the seating card!"</i>
    
    📌 The gala actually ended at 9 PM per the event coordinator. But you already know his real secret...
    
    {has_teddy_snacks:
        (You know Teddy disabled the cameras for midnight snack runs. He's guilty of diet cheating, not horse theft.)
    }
    -> choose_suspect

+ [You recently doubled the insurance on the Golden Horse.]
    Teddy turns a shade of purple you didn't think was possible.
    
    <i>"A STANDARD business decision! The horse appreciated in value! It would be IRRESPONSIBLE not to increase coverage! Are you implying that I — how DARE you!"</i>
    
    📌 Very defensive, but the insurance angle doesn't match the actual method of the crime.
    -> choose_suspect

+ [← Back] -> choose_suspect

=== evidence_board ===

📋 <b>YOUR EVIDENCE BOARD</b>
━━━━━━━━━━━━━━━━━━━━━

{has_glitter: 🔬 Golden glitter trail → carousel to tunnels}
{has_bolt: 🔬 Security bolt professionally unscrewed}
{has_cameras: 🔬 Cameras disabled 10 PM - 2 AM (admin access)}
{has_dolly: 🔬 300-lb dolly cart missing from tunnels}
{has_labcoat_witness: 👁️ Lab coat person at carousel, 11 PM, with tools}
{has_two_people: 👁️ TWO people in tunnels at midnight, one pushing cart}
{has_wendy_searches: 💭 Wendy: searched 'antique shipping' + 'horse value'}
{has_wendy_lights: 🔬 Wendy: office lights OFF after 10 PM (alibi broken)}
{has_pete_log: 🔬 Pete: absent from workshop 9 PM - 3 AM (6-hour gap)}
{has_janet_alibi: 👁️ Janet: left kitchen at 8 PM (not "all night")}
{has_teddy_snacks: 😄 Teddy: disabled cameras for midnight snacks!}
{has_wendy_receipt: 🔬 Wendy: ordered replica horse supplies 3 WEEKS ago}
{has_wendy_shipping: 🔬 Wendy: shipped 200-lb package overseas 2 WEEKS ago}
{has_pete_blueprints: 🔬 Pete: blueprints for carousel horse removal tool}
{has_pete_payment: 💭 Pete: received $50,000 from Wendy's account}
{has_dock_manifest: 🔬 Dock: Wendy signed for 200-lb outbound shipment}

━━━━━━━━━━━━━━━━━━━━━
{clues_found} clues collected. {suspects_questioned} interrogations conducted.
{wendy_confronted: ⚡ Wendy confronted with evidence}
{pete_confronted: ⚡ Pete confronted with evidence}
{twist_revealed: 🔴 PLOT TWIST REVEALED}

{clues_found >= 10 and not twist_revealed:
    🔔 <b>BREAKTHROUGH!</b> You have enough evidence to trigger a major discovery...
    + [🔴 Follow up on the evidence...] -> plot_twist
    + [Keep investigating first] -> hub
}

+ [← Back to Map] -> hub

=== plot_twist ===
# MOOD: dramatic
~ twist_revealed = true

🔴 <b>═══ PLOT TWIST ═══</b>

You're reviewing all the evidence when something clicks. The timeline. It doesn't add up.

If the theft happened last night, why does Wendy's shipping receipt predate it by two weeks? Why were replica supplies ordered three weeks ago?

You rush back to the carousel with a forensics kit and scrape a sample of the remaining mounting paint...

<b>The lab results come back in minutes:</b>

The paint on the carousel pole is <i>fresh</i>. Less than three weeks old. But the carousel was last repainted <i>five years ago</i>.

Someone repainted the pole... to hide the fact that a <b>different horse</b> was recently mounted there.

💥 <b>THE HORSE THAT WAS "STOLEN" LAST NIGHT WAS A REPLICA.</b>

The REAL Golden Horse was swapped out <b>weeks ago</b>. Last night's theft was staged — a performance to make everyone think the crime just happened, hiding the real timeline.

Everything you thought you knew just changed. Go back and search the locations again — there's new evidence to find.

+ [This changes everything... → Back to Map] -> hub

=== accusation ===

⚖️ <b>FINAL ACCUSATION</b>

You've gathered your evidence. You've questioned the suspects. Now it's time to make your case.

Clues found: {clues_found}. Suspects questioned: {suspects_questioned}.
{wendy_confronted: ✅ Confronted Wendy.}
{pete_confronted: ✅ Confronted Pete.}

Who is the <b>primary culprit</b> — the mastermind?

+ [Dizzy Dave — the Carousel Operator]
    ~ accused = "dave"
    -> pick_accomplice
+ [Widget Wendy — Head of Merchandise]
    ~ accused = "wendy"
    -> pick_accomplice
+ [Professor Peculiar Pete — Park Engineer]
    ~ accused = "pete"
    -> pick_accomplice
+ [Jolly Janet — Head Chef]
    ~ accused = "janet"
    -> pick_accomplice
+ [Teddy Pemberton III — Park Director]
    ~ accused = "teddy"
    -> pick_accomplice
+ [← I need more evidence] -> hub

=== pick_accomplice ===

Did the mastermind have an <b>accomplice</b>?

+ [Yes — Dizzy Dave]
    ~ accomplice = "dave"
    -> reveal
+ [Yes — Widget Wendy]
    ~ accomplice = "wendy"
    -> reveal
+ [Yes — Professor Pete]
    ~ accomplice = "pete"
    -> reveal
+ [Yes — Jolly Janet]
    ~ accomplice = "janet"
    -> reveal
+ [Yes — Teddy Pemberton]
    ~ accomplice = "teddy"
    -> reveal
+ [No — they acted alone]
    ~ accomplice = "none"
    -> reveal

=== reveal ===
# LOCATION: reveal
# MOOD: dramatic

━━━━━━━━━━━━━━━━━━━━━
🔍 <b>THE TRUTH IS REVEALED</b>
━━━━━━━━━━━━━━━━━━━━━

{accused == "wendy":
    ✅ <b>CORRECT!</b> Widget Wendy Wu is the mastermind behind the Carousel Caper!
    { accomplice == "pete":
        ✅ <b>AND CORRECT AGAIN!</b> Professor Peculiar Pete was her accomplice!
        🏆 <b>PERFECT DEDUCTION!</b> You cracked the case completely!
    - else:
        ❌ But you missed her accomplice — <b>Professor Peculiar Pete</b>.
        🥈 Close! You identified the mastermind but missed the partner.
    }
- else:
    ❌ The real mastermind was <b>Widget Wendy Wu</b>, with help from <b>Professor Peculiar Pete</b>.
    🤔 The evidence was there, but the dots weren't quite connected.
}

📖 <b>THE FULL STORY</b>

Wendy's plan was almost perfect.

<b>Three weeks ago:</b> She contacted Master Sculptors LLC and commissioned a perfect replica of the Golden Horse — same weight, same dimensions, same gold finish.

<b>Two weeks ago:</b> With Pete's custom extraction tool and engineering expertise, they swapped the real horse for the replica under cover of night. Pete's 6-hour absence from his workshop? That was the swap.

<b>One week ago:</b> The real Golden Horse was shipped overseas to a private collector in Monaco, disguised as a routine merchandise return. Wendy signed the dock manifest herself.

<b>Last night:</b> Pete staged the "theft" of the replica — leaving the golden glitter trail, the professional bolt marks, the whole scene — to create a false crime scene. If everyone believed the horse was stolen <i>last night</i>, no one would look at what happened two weeks ago.

The motive? Wendy planned to sell the $2 million Golden Horse to a private collector, splitting the profits with Pete. The $50,000 payment was just the down payment for his help.

{has_teddy_snacks:
    As for the mystery of the disabled security cameras? That was just Teddy Pemberton sneaking midnight snacks while hiding from his wife's diet surveillance program. Some crimes solve themselves. 😄
}

As park security escorted Wendy and Pete away, Dizzy Dave could be heard sobbing with relief through the crowd: <i>"I KNEW my horse didn't run away!"</i>

The Golden Horse was recovered from a shipping container at Miami Port three days later and returned to its rightful place on the Grand Carousel.

<b>Case Status: CLOSED</b>
<b>Detective Rating: {accused == "wendy" and accomplice == "pete": ⭐⭐⭐⭐⭐ MASTER DETECTIVE}
{accused == "wendy" and accomplice != "pete": ⭐⭐⭐⭐ SENIOR INVESTIGATOR}
{accused != "wendy": ⭐⭐⭐ JUNIOR DETECTIVE}</b>
<b>Evidence Collected: {clues_found}/16</b>

-> END

# Round 3: five chapter 1 creatures

The other two starters and three creatures from the Meadow Path, the first route:

| Creature | Where in the game | Body type in the game | Animation plan |
| --- | --- | --- | --- |
| Mossback | Starter (Plant) | turtle | `quad` for now |
| Embroak | Starter (Fire) | frog | `quad` for now |
| Clovermouse | Meadow Path | quad (drawn sitting up) | `quad` |
| Puffmunk | Meadow Path, uncommon | quad (drawn sitting up) | `quad` |
| Fleecling | Meadow Path, rare, daytime | quad | `quad` |

Hopsprout (Meadow Path, `bug` body) waits until the bug skeleton exists.

- `picture-request.html`: the prompts and reference sprites. Five pictures per creature, 25 in all.
- `make_picture_request.py`: makes the page (`python3 -I make_picture_request.py ../reference picture-request.html`).
- Reference sprites: `../reference/<creature>-sprite-reference.png`.

Next, once the pictures are back: build with the small-model-only route (`../pipeline/route_small.sh`),
then animate with `../pipeline/animate.py`.

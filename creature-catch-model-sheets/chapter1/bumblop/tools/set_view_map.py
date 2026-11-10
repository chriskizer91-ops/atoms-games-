"""opus tool (round 3): set a view's picture-to-metres numbers by hand in views.json.

usage: python3 -I set_view_map.py views.json VIEW key=value [key=value ...]

make_views.py stretches the top picture so its bounding box matches the front width and the side
length. When the top picture draws the creature in a different pose (Clovermouse's top view lies
the tail flat on the ground, so the box is far too long), that stretch moves everything. This sets
e.g. sy (pixels per metre along the length) and vc (picture row of y = 0) directly.
"""
import json
import sys


def main():
    path, view = sys.argv[1], sys.argv[2]
    d = json.load(open(path))
    for kv in sys.argv[3:]:
        k, v = kv.split("=")
        old = d["views"][view].get(k)
        d["views"][view][k] = float(v)
        print(f"{view}.{k}: {old} -> {float(v)}")
    json.dump(d, open(path, "w"), indent=1)


if __name__ == "__main__":
    main()

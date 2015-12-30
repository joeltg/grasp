GRASP
================
It's easy to look at lines of code and think you know what programming is, but text is only one of many possible representations. GRASP visualizes Scheme ASTs with as little text as possible, using a force-directed 3D graph to organize the program's structure. Data transformation happens laterally with functions, while references and variable scoping happen vertically.

![](https://raw.githubusercontent.com/joeltg/grasp/master/screenshots/0.png)

In GRASP, variables don't need to be named, since every reference links back to just one spatially unique node in the original scope in which it was defined. Similarly, functions also don't need labels, since they can link back to their original definitions.

![](https://raw.githubusercontent.com/joeltg/grasp/master/screenshots/1.png)

GRASP is an ongoing project. The project's long-term goal is to eliminate the need for text entirely (changing the mindset to optionally "labeling" nodes to be searchable later), and implement a completely visual Scheme IDE in imersive VR, but right now I'm working on making the graph editable directly by dragging edges from node to node, reflecting those changes dynamically in the textual code, and working on integrating a Scheme to JavaScript interpreter to visualize data flow in program execution step-by-step or in real-time.

##Demo
http://joeltg.github.io/grasp

##Name
GRASP is short for GRAphical liSP. Yes, I know.

##Inspiration
GRASP was heavily inspired by many projects and people, only some of which are listed here.
- GRAIL (RAND Corp)
  - ["Free electronic document"](http://www.rand.org/pubs/research_memoranda/RM5999.html), whatever that means
  - [Demo by Alan Kay](https://www.youtube.com/watch?v=QQhVQ1UG6aM)
- [Full Metal Jacket](http://web.onetel.net.uk/~hibou/fmj/FMJ.html)
- [Bret Victor](http://worrydream.com), a god among mortals, particularily for
  - [The Future of Programming](https://vimeo.com/71278954) and
  - [Learnable Programming](http://worrydream.com/#!/LearnableProgramming)
- [Scratch](https://scratch.mit.edu/), but only it convinced me that we can do so much better
- [NoFlo](http://noflojs.org/), for reasons similar to Scratch
- [Ivan Sutherland](https://en.wikipedia.org/wiki/Ivan_Sutherland) and [Sketchpad](https://en.wikipedia.org/wiki/Sketchpad)
- [Eve](http://eve-lang.com/)

##Credits
- [Three.js](https://github.com/mrdoob/three.js/)
- [Ace editor](https://github.com/ajaxorg/ace)
- [paredit.js](https://github.com/rksm/paredit.js)

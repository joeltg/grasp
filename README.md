GRASP
================
It's easy to look at lines of code and think you know what programming is, but text is only one of many possible representations. GRASP visualizes Scheme ASTs with as little text as possible, using a force-directed 3D graph to organize the program's structure. Data transformation happens laterally with functions, while references and variable scoping are organized vertically.

- Functions are green
- Variables are blue
- Lexical environments are translucent
- That's about it

![](https://raw.githubusercontent.com/joeltg/grasp/master/screenshots/0.png)

In GRASP, variables don't need to be named, since every reference links back to just one spatially unique node in the original environment in which it was defined (thanks to lexial scoping). Similarly, functions also don't need labels, since they can link back to their original definitions. The "Labels" switch toggles these optional labels.

![](https://raw.githubusercontent.com/joeltg/grasp/master/screenshots/1.png)

GRASP is an ongoing project. The project's long-term goal is to eliminate the need for text entirely (changing the mindset to optionally "labeling" nodes to be searchable later), and implement a completely visual Scheme IDE in imersive VR, but right now I'm working on making the graph editable directly by dragging edges from node to node while reflecting those changes dynamically in the textual code, and working on integrating a Scheme to JavaScript interpreter to visualize data flow in program execution step-by-step or in real-time.

###Wait, this is just like every other visual programming thing I've seen
Well, no. It isn't.
All the visual "languages" that exist are shallow wrappers around inherently textual code, and usually end up requiring the user to type just as many characters to do the same thing, or (worse!) expose some pre-selected GUI toolbox of all the functions you can drag-and-drop. The goal of GRASP is to eliminate the keyboard altogether, and enable open-ended program construction in an interactive, intuitive manner that scales with program complexity and size. It seems subtle, but the difference is very fundamental.

###Wait, the graph looks harder to understand than the code
It probably does! That's because 1) this is in pre-alpha and I haven't got the graphics to work well, but mostly 2) you've spent n years staring enormous text files of code and your brain has trained for ages to parse it. For large n, it actually gets more difficult to think about programs in new contexts or in new representations: as Marvin Minsky once said, "anyone could learn Lisp in one day, except that if they already knew Fortran, it would take three days."

Grab the nearest non-coder and see if they 'get' GRASP. You might be surprised.

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
  - [The Future of Programming](https://vimeo.com/71278954)
  - [Learnable Programming](http://worrydream.com/#!/LearnableProgramming)
  - [Alligator Lambda Calculus](http://worrydream.com/#!/AlligatorEggs)
- [Scratch](https://scratch.mit.edu/), but only because it convinced me that we can do so much better
- [NoFlo](http://noflojs.org/), for reasons similar to Scratch
- [Ivan Sutherland](https://en.wikipedia.org/wiki/Ivan_Sutherland) and [Sketchpad](https://en.wikipedia.org/wiki/Sketchpad)
- [Eve](http://eve-lang.com/)

##Credits
- [Three.js](https://github.com/mrdoob/three.js/)
- [Ace Editor](https://github.com/ajaxorg/ace)
- [paredit.js](https://github.com/rksm/paredit.js)
- [Material Design Lite](https://github.com/google/material-design-lite)

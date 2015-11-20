# Hit The Green Square
###### Beta Version Source Code

Puzzle game inspired by [DX Ball](http://www.blitwise.com/superdxb.html) and [Mark of the Ninja](https://www.kleientertainment.com/games/mark-ninja). Playable on web browsers that support WebGL.

Your objective is to find and hit the green block. There are many obstacles in your path that you'll have to deal with.

You control a paddle and a ball, and your ball has 360 degrees of sight. Hence, finding the Green block is your first task. Then, all you've got to do is to destroy it!

#### Features
* **360 degrees of sight** for your **ball**. You just can't see through solid objects. 
* Your ball loses **Health** upon collisions. Health is restored once you reach the paddle. You have only one ball.
* **Brown blocks** that can be destroyed.
* **White blocks** that are (for now) indestructible.
* **Green blocks** are the objective.
* **Last Known Positions** of blocks are visible on the map.
* **Marking and tracking** that allow the player to track the movement of blocks.

#### Controls
* `WASD` or `Arrow Keys` to move the paddle horizontally and vertically.
* `QE` or `ZC` to move the paddle clockwise or Anti-clockwise.
* `M` to enable Marking.
* Use the `Mouse` to aim the ball.
* Use the `Mouse` or press `Space` to fire the ball from the paddle.

***
## Instructions
#### Through the Festember website
[Festember '15 Website](http://games.festember.com/hit-the-green-square)

#### Using the Cocos Console
* Clone the repo `git clone https://github.com/sathiyavrs/HitTheGreenSquare`.
* `cd` to the directory.
* Run the command `cocos run -p web`.

#### Using Python's Simple HTTP Request Handler
* Clone the repo `git clone https://github.com/sathiyavrs/HitTheGreenSquare`.
* `cd` to the directory.
* Run the command `python -m SimpleHTTPServer`.
* Open the localhost at the port serving HTTP in your browser, usually by typing `localhost:8000` in the address bar.

***
## Software Used
* [Cocos2d-JS v3.6.1](https://github.com/cocos2d/cocos2d-js)
* [Tiled Map Editor v0.13.0](https://github.com/bjorn/tiled)
* [Chipmunk Physics](https://github.com/josephg/chipmunk-js)

Chipmunk Pysics was integrated with Cocos2d-JS.
***
### Miscellaneous Notes
Includes code for two features which sadly didn't make it into the build because they didn't fit in : 
* **Sonar** (See through walls)
* **Smash Hit** (Destroy white objects)

***

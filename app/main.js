var game = new Phaser.Game(800, 640, Phaser.AUTO, '');

var stateMenu = {
    preload: function() {
        this.load.image('splash', 'assets/splash.png');
    },
    create: function() {
        this.add.sprite(0, 0, 'splash');
        var titleStyle = {font: '32px Arial', fill:'#5f5', stroke:'#000', strokeThickness:3};
        var title = this.add.text(200, 139, "Stellar Swarm", titleStyle);
        title.autoRound = true;
        var clickStyle = {font: '32px Arial', fill:'#ccc', stroke:'#000', strokeThickness:3};
        this.add.text(32, 640 - 60, "Click to start!", clickStyle);

        var loreStyle = {font: '20px Arial', fill:'#ccc', stroke:'#000', strokeThickness:3};
        var lore = this.add.text(64, 64, "The world broke and there's only a tiny piece left.\nNow these creepy space bugs are attacking.", loreStyle);

        game.input.onDown.add(this.onDown, this);
    },
    onDown: function() {
        this.state.start('Game');
    }
};

function turret_init(turret) {
    turret.key = 'turret';
    turret.anchor.x = 0.36;
    turret.anchor.y = 0.5;
    turret.lastShot = 0;
}
function turret_aimAt(turret, x, y) {
    var angle = Math.atan2((y - turret.y), (x - turret.x));
    turret.rotation = angle;
}

var highScore = 0;

var stateGame = {
    preload: function() {
        this.load.image('turret', 'assets/turret.png');
        this.load.image('bullet1', 'assets/projectile1.png');
        this.load.image('bullet2', 'assets/projectile3.png');
        this.load.image('bullet3', 'assets/projectile2.png');
        this.load.image('bullet4', 'assets/projectile4.png');
        this.load.image('bullet5', 'assets/projectile5.png');
        this.load.image('island', 'assets/island1.png');
        this.load.image('space', 'assets/space.png');
        this.load.spritesheet('bug1', 'assets/bug1.png', 32, 32);
        this.load.spritesheet('bug2', 'assets/bug2.png', 32, 32);
        this.load.spritesheet('bug3', 'assets/bug3.png', 32, 32);
        this.load.spritesheet('bug4', 'assets/bug4.png', 32, 32);
        this.load.spritesheet('bug5', 'assets/bug5.png', 32, 32);
        this.load.spritesheet('bug6', 'assets/bug6.png', 32, 32);
        this.load.spritesheet('explosion', 'assets/explosion.png', 32, 32);
        this.load.spritesheet('nuke', 'assets/nuke.png', 32, 32);

        game.load.audio('explosion', 'assets/explosion2.wav');
        game.load.audio('pew', 'assets/pew3.wav');
        game.load.audio('nuke', 'assets/nuke.wav');
    },
    create: function() {
        this.spaceSprite = game.add.tileSprite(0, 0, 800, 640, 'space');

        this.turretSprite = this.add.sprite(400-16, 300-16, 'turret');
        this.turretSprite = this.add.sprite(0, 0, 'island');

        this.explosionSound = game.add.audio('explosion');
        this.pewSound = game.add.audio('pew');
        this.nukeSound = game.add.audio('nuke');

        this.turrets = game.add.group();
        this.turrets.enableBody = true;
        //turret_init(this.turrets.create(300, 250, 'turret'));
        //turret_init(this.turrets.create(400, 320, 'turret'));
        this.turretDelay = 500;
        this.turretLevel = 0;

        this.bullets = game.add.group();
        this.bullets.enableBody = true;
        this.bulletSpeed = 128;

        this.explosions = game.add.group();

        this.expulooosion = game.add.graphics(game.world.centerX, game.world.centerY);
        this.nukeTime = false;
        this.nukeProgress = 0;

        this.bugs = game.add.group();
        this.bugs.enableBody = true;
        this.bugSpeed = 90;

        this.nukeButton = game.add.button(64, 640 - 64, 'nuke', this.actionOnNuke, this);
        this.nukeButton.kill();

        this.pointerDown = false;
        game.input.onDown.add(this.onDown, this);
        game.input.onUp.add(this.onUp, this);

        this.gameStart = game.time.now;
        this.gameOver = false;
        this.clickToRetry = false;

        this.scoreText = this.add.text(4, 4, "Score: 0", {font: '20px Arial', fill:'#fff'});
        this.add.text(4, 24, "Hi-score: " + highScore, {font: '12px Arial', fill:'#ddd'});
        this.score = 0;

        this.turretPlacementsLeft = 3;
        this.turretPlacementInstructionsText = this.add.text(300, 64, "Click to place turrets!", {font: '32px Arial', fill:'#ddd', stroke:'#000', strokeThickness:4});
        this.turretPlacementText = this.add.text(300, 128, "Turrets left: " + this.turretPlacementsLeft, {font: '24px Arial', fill:'#ddd', stroke:'#000', strokeThickness:3});
        //startInvasion();
    },
    startInvasion: function() {
        this.spawnTimer = game.time.create(false);
        this.spawnTimer.add(10, this.spawnBugs, this);
        this.spawnTimer.start();

        this.nukeTimer = game.time.create(false);
        this.nukeTimer.add(10000, this.placeNuke, this);
        this.nukeTimer.start();
    },
    update: function() {
        if (this.turretPlacementsLeft > 0) return;

        game.physics.arcade.overlap(this.bullets, this.bugs, this.damageBug, null, this);
        game.physics.arcade.overlap(this.bugs, this.turrets, this.damageTurret, null, this);

        this.spaceSprite.tilePosition.x = Math.sin(game.time.now / 1000 / 30 * Math.PI) * 128;
        this.spaceSprite.tilePosition.y = game.time.now / 1000 * 32;

        if (this.nukeTime) {
            this.nukeProgress += game.time.physicsElapsed;

            this.expulooosion.beginFill(0xffffff);
            var size = 1200 * Math.pow(this.nukeProgress, 2);
            this.expulooosion.drawCircle(0, 0, size);
            this.expulooosion.endFill();

            if (this.nukeProgress >= 1) {
                this.nukeTime = false;
            }
        }
        else {
            if (this.nukeProgress > 0) {
                this.expulooosion.destroy();
                this.expulooosion = game.add.graphics(game.world.centerX, game.world.centerY);
            }
        }

        if (this.pointerDown) {
            if (this.gameOver) return;
            var self = this;
            this.turrets.forEachAlive(function(turret) {
                if (game.time.now < turret.lastShot + self.turretDelay) return;
                turret.lastShot = game.time.now;
                var pointer = game.input.activePointer;
                turret_aimAt(turret, pointer.x, pointer.y);
                var angle = Math.atan2((pointer.y - turret.y), (pointer.x - turret.x));
                var bullet = self.bullets.getFirstDead(true, turret.x + Math.cos(angle) * 24, turret.y + Math.sin(angle) * 24, 'bullet' + (self.turretLevel+1));
                bullet.anchor.x = 0.5; bullet.anchor.y = 0.5;
                bullet.rotation = angle;
                bullet.lifespan = 10000;
                bullet.checkWorldBounds = true;
                bullet.outOfBoundsKill = true;
                bullet.body.setCircle(10);
                bullet.body.velocity.x = Math.cos(angle) * self.bulletSpeed * (self.turretLevel < 1 ? 1 : 1.5);
                bullet.body.velocity.y = Math.sin(angle) * self.bulletSpeed * (self.turretLevel < 1 ? 1 : 1.5);
                self.score -= 5;

                self.pewSound.play('', 0, 0.6, false, true);
            });
            this.increaseScore(0);
        }
    },
    actionOnNuke: function() {
        this.nukeButton.kill();
        this.nukeSound.play('', 0, 0.3, false, true);

        this.nukeTime = true;
        this.nukeProgress = 0;

        var killDelay = game.time.create(false);
        killDelay.add(500, function() {
            this.bugs.forEachAlive(function(bug) {
                bug.kill();
            });
        }, this);
        killDelay.start();
    },
    damageBug: function(bullet, bug) {
        this.showExplosionAt(bug.x, bug.y);
        bug.damage(1);
        bullet.kill();
        this.increaseScore(100);

        if (this.score >= 15000) {
            this.turretLevel = 1;
            this.turretDelay = 400;
        }

        this.explosionSound.play('', 0, 0.3, false, true);
    },
    damageTurret: function(bug, turret) {
        this.showExplosionAt(turret.x, turret.y);
        turret.kill();
        if (this.turrets.countLiving() == 0) this.endGame();

        this.explosionSound.play('', 0, 0.5, false, true);
    },
    spawnBugs: function() {
        var horizontal = Math.random()>0.5;
        var bug = this.bugs.getFirstDead(
            true,
            horizontal ? Math.random()*800 : (Math.random()>0.5 ? 0-24 : 800+24),
            horizontal ? (Math.random()>0.5 ? 0-24 : 640+24) : Math.random()*640,
            'bug' + (1+Math.floor(Math.random() * 6))
        );
        bug.health = 2;
        bug.lifespan = 10000;
        bug.anchor.x = 0.5; bug.anchor.y = 0.5;
        if (bug.animations.getAnimation('fly') === null) bug.animations.add('fly');
        bug.play('fly', 8, true);

        var turret = this.turrets.getRandomExists();
        if (turret) var angle = Math.atan2((turret.y - bug.y), (turret.x - bug.x));
        else var angle = Math.random() * Math.PI * 2;

        var speed = this.bugSpeed + Math.random()*(this.bugSpeed/2) - Math.random()*(this.bugSpeed/3);
        bug.body.velocity.x = Math.cos(angle) * speed;
        bug.body.velocity.y = Math.sin(angle) * speed;
        bug.rotation = angle;

        var secondsSinceStart = (game.time.now - this.gameStart) / 1000;
        this.spawnTimer.add(5000 / Math.log2(Math.max(2, secondsSinceStart)), this.spawnBugs, this);
    },
    placeNuke: function() {
        this.nukeButton.revive();
        this.nukeTimer.add(60000, this.placeNuke, this);
    },
    onDown: function(pointer) {
        if (this.clickToRetry) this.state.start('Game');
        this.pointerDown = true;

        if (this.turretPlacementsLeft > 0) {
            turret_init(this.turrets.create(pointer.x, pointer.y, 'turret'));
            this.turretPlacementsLeft -= 1;
            this.turretPlacementText.text = "Turrets left: " + this.turretPlacementsLeft;
            if (this.turretPlacementsLeft <= 0) {
                this.turretPlacementText.destroy();
                this.turretPlacementInstructionsText.destroy();
                this.startInvasion();
            }
        }
    },
    onUp: function(pointer) {
        this.pointerDown = false;
    },
    showExplosionAt: function(x, y) {
        var explosion = this.explosions.getFirstDead(true, x, y, 'explosion');
        if (explosion.animations.getAnimation('explode') === null) explosion.animations.add('explode');
        explosion.anchor.x = 0.5; explosion.anchor.y = 0.5;
        explosion.play('explode', 16, false, true);
    },
    increaseScore: function(amount) {
        this.score += amount;
        this.scoreText.text = "Score: " + this.score;
    },
    endGame: function() {
        if (this.score > highScore) {
            highScore = this.score;
            this.add.text(4, 40, "New Highscore!", {font: '30px Arial', fill:'#0d0', stroke:'#000', strokeThickness:2});
        }

        this.gameOver = true;
        var style = {font: '60px Arial', fill:'#d00', align:'center', stroke:'#000', strokeThickness:4};//, boundsAlignH:'center', boundsAlignV:'middle'};
        var gameOverText = this.add.text(250, 200, "Game Over", style);

        var timer = game.time.create(false);
        timer.add(500, function() {
            var style = {font: '30px Arial', fill:'#fff', align:'center', stroke:'#000', strokeThickness:3};//, boundsAlignH:'center', boundsAlignV:'middle'};
            this.add.text(270, 270, "Click to retry", style);
            this.clickToRetry = true;
        }, this);
        timer.start();
    }
};

game.state.add('Menu', stateMenu);
game.state.add('Game', stateGame);

game.state.start('Menu');

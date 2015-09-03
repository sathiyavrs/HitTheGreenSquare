var MyPhysicsSprite = cc.PhysicsSprite.extend({
    space: null,
    shape:null,
	LayerMaskValue: 0,

    ctor: function (space) {
        this._super(res.CloseSelected_png, cc.Rect(0, 0, 0, 0));
        var body = new cp.Body(2, cp.momentForBox(2, this.getContentSize().width, this.getContentSize().height));
        var shape = new cp.BoxShape(body, this.getContentSize().width, this.getContentSize().height);

        this.shape = shape;
        this.shape.setCollisionType(1);
        this.setBody(body);
        this.space = space;
        this.body.setPos(this.getPosition());
		
		this.LayerMaskValue = 2;
		this.shape.layers = 4;
		
        this.space.addBody(body);
        this.space.addShape(shape);
    }
});
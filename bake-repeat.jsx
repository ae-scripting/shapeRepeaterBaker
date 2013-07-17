// BakeRepeat - tool similar to Cinema 4D's "curret state object"
// Creates copies of shape populated by Repeater modifier

//v0.5 by Nik Ska, 2013

//License
//Attribution-ShareAlike 3.0 Unported (CC BY-SA 3.0)
//You are free to use this code in your personal projects
//as long as it's open source and not commercial.

var repBaker = this;

repBaker.buildGUI = function(thisObj){
	thisObj.w = (thisObj instanceof Panel) ? thisObj : new Window("palette", thisObj.scriptTitle, undefined, {resizeable:true});
	thisObj.w.alignChildren = ['left', 'top']
	thisObj.w.minimumSize = "width: 150, height: 110";
    thisObj.w.maximumSize = "width:150, height: 110";

	thisObj.w.add("staticText", undefined, "Shape Repeater Baker");
	var bakeit = thisObj.w.add("button", undefined, "Bake repeater");
	bakeit.size = [120,20];

	var lineTwo = thisObj.w.add("group{orientation:'row'}");
    lineTwo.size = "width: 125, height: 25";

    var removeRepeater =lineTwo.add("checkbox", undefined, "Remove repeater")


	bakeit.onClick = function(){
		thisObj.doit(removeRepeater.value);
	}

	if (thisObj.w instanceof Window){
    thisObj.w.center();
    thisObj.w.show();
  }
  else thisObj.w.layout.layout(true);
}

repBaker.doit = function(_remove){
	//Main script function
	//_remove - remove or leave the repeater

	var repeaterInstances = [{}]; //array for repeater(s)
	function getRepeaterInstance(_arr){
		//filter out selected properties
		for(var j = 0 ; j < _arr.length ; j ++){
			if(_arr[j].matchName == "ADBE Vector Filter - Repeater"){
				return _arr[j]
			}
		}
		return null
	}

	function removeRepeater(_group, _name){
		var pr = _group;
        for(var k = pr.numProperties; k>0 ; k--){
            if(pr.property(k).name == _name){
            	pr.property(k).remove();
            	break;
            }
        }
	}

	function reverseOrder(_group, _num){
		var pr = _group;
		var move = _num;
		for(var j = _num ; j > 0; j--){
			pr.property(_num+1).moveTo(_num-j+1)
		}
	}

	var activeItem = app.project.activeItem;
	if(activeItem != null && activeItem instanceof CompItem){
		var sel = activeItem.selectedLayers;
	    var rep = getRepeaterInstance(activeItem.selectedProperties);

	    if(rep!=null){
	    	if(rep.propertyIndex > 2) alert("Group all layers above repeater")
	    	else if(rep.propertyIndex == 1) alert("Put at least something above repeater")
	    	else{
	    		var repName = rep.name;
	    		var numCopies = rep["ADBE Vector Repeater Copies"].value;
	    		var order = rep["ADBE Vector Repeater Order"].value;
	    		var repGroup = rep.parentProperty;
                
	    		app.beginUndoGroup("Bake repeater");
		    	repeaterInstances[0].repeater = rep;
		        this.getRepeaterAttr(rep, repeaterInstances[0]);
		        
			    var _obj = repGroup.property(1);
			    this.makeCopies(_obj, repeaterInstances[0]);
                
                if(_remove == true) removeRepeater(repGroup, repName);
                if(order == 1) reverseOrder(repGroup, numCopies);
			    app.endUndoGroup();
			}
		}
		else alert("Select repeater you want to bake")
	}
}

repBaker.makeCopies =function(_obj, _repeater){
	var numCopies = Number(_repeater["ADBE Vector Repeater Copies"]);
	_repeater.repeater.enabled = false;
	
    var tmp = _obj;
    var offset = Number(_repeater["ADBE Vector Repeater Offset"]);
	for (var i = offset; i < numCopies+offset; i++) {
		this.setAttrFromRepeater([tmp], _repeater, i);
		tmp = tmp.duplicate();
        
	};
}

repBaker.setAttrFromRepeater = function(_shape, _repeater, _num){
	//function to set shape properties based on repeater object
	//_shape is a set of shapes to appy transform to
	//_repeater is a repeater instance
	//_num is the copy number

	for(var k = 0 ; k < _shape.length ; k++){
		var tr = _shape[k].property("ADBE Vector Transform Group");
		var offset = Number(_repeater["ADBE Vector Repeater Offset"]);
		if(_num == offset){
			//moving first copy
			tr.property("ADBE Vector Anchor").setValue(tr.property("ADBE Vector Anchor").value + _repeater["ADBE Vector Repeater Anchor"] - tr.property("ADBE Vector Position").value);
			tr.property("ADBE Vector Position").setValue(_repeater["ADBE Vector Repeater Anchor"]);
		}
		else{
			//all the others
			tr.property("ADBE Vector Position").setValue(tr.property("ADBE Vector Position").value +_repeater["ADBE Vector Repeater Position"]);
			tr.property("ADBE Vector Scale").setValue([tr.property("ADBE Vector Scale").value[0]*(_repeater["ADBE Vector Repeater Scale"][0]/100), tr.property("ADBE Vector Scale").value[1]*(_repeater["ADBE Vector Repeater Scale"][1]/100)]);
			tr.property("ADBE Vector Rotation").setValue(tr.property("ADBE Vector Rotation").value+_repeater["ADBE Vector Repeater Rotation"]);
		}
		tr.property("ADBE Vector Group Opacity").setValue(_repeater["ADBE Vector Repeater Opacity 1"] + (_num-offset)*(_repeater["ADBE Vector Repeater Opacity 2"]-_repeater["ADBE Vector Repeater Opacity 1"])/_repeater["ADBE Vector Repeater Copies"]);
		}
    }

/*
function setExpression(){
	//placeholder for the expression setter

}

function bakeExpression(){
	//placeholder for expressions baker
}
*/

repBaker.getParentLayer = function(_property){
    //recursively gets the parent layer
    if(_property.propertyDepth>0){
        return getParentLayer(_property.parentProperty);
        }
    else{
        return _property;
        }
    }   

repBaker.getRepeaterAttr = function(_property, repInstance){
	//recursive function to collect all repeater settings
	//first - check if we walk over a property group
	if(_property.propertyType == PropertyType.NAMED_GROUP){
		for(var i = 1; i <= _property.numProperties; i++){
			if(_property.property(i).propertyType == PropertyType.NAMED_GROUP){
				this.getRepeaterAttr(_property.property(i), repInstance)
			}
			else{
				//set repeater instance's values
                repInstance[_property.property(i).matchName] = _property.property(i).value;
			}
		}
	}
	else return null
}

repBaker.buildGUI(repBaker)
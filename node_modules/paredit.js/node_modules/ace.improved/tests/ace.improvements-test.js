/*global process, expect, beforeEach, afterEach, describe, it*/

describe('improvements', function() {

  var ed;
  beforeEach(function() {
    ed = createEditor("this is a\ntest\n\ntext\n");
  });

  afterEach(function() {
    if (ed) {
      ed.destroy();
      ed.container.parentNode.removeChild(ed.container);
    }
  });

  describe("selection", function() {

    it("selects via range string", function() {
      ed.setSelection("[0/2]->[0/4]");
      expect(ed).to.have.selection("[0/2]->[0/4]");
      expect(ed.getSelectedText()).eq("is");
      expect(ed.selection.isBackwards()).eq(false);
    });

    it("selects via range string backward", function() {
      ed.setSelection("[0/4]->[0/2]");
      expect(ed.getSelectedText()).eq("is");
      expect(ed.selection.isBackwards()).eq(true);
    });

    it("selects via index", function() {
      ed.setSelection(1,3);
      expect(ed.getSelectedText()).eq("hi");
      expect(ed.selection.isBackwards()).eq(false);
    });

    it("selects via index backwards", function() {
      ed.setSelection(3,1);
      expect(ed.getSelectedText()).eq("hi");
      expect(ed.selection.isBackwards()).eq(true);
    });

    it('saveExcursion', function(done) {
      expect(ed).to.exist();
      ed.setSelection("[0/2]->[0/4]");
      ed.saveExcursion(function(reset) {
        ed.selection.clearSelection();
        expect(ed).to.have.selection("[0/4]->[0/4]");
        reset();
        expect(ed).to.have.selection("[0/2]->[0/4]");
        done();
      });
    });
  });

});

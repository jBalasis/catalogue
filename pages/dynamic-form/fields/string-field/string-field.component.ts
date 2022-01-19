import {Component, EventEmitter, Input, OnInit, Output} from "@angular/core";
import {Fields, HandleBitSet} from "../../../../domain/dynamic-form-model";
import {FormArray, FormControl, FormGroup, FormGroupDirective, Validators} from "@angular/forms";
import {urlAsyncValidator, URLValidator} from "../../../../shared/validators/generic.validator";
import {FormControlService} from "../../../../services/form-control.service";

@Component({
  selector: 'app-string-url-email-field',
  templateUrl: './string-field.component.html',
  styles: ['.clear-style { height: 0 !important;}']
})

export class StringFieldComponent implements OnInit {
  @Input() fieldData: Fields;
  @Input() editMode: any;
  @Input() position?: number = null;

  @Output() hasChanges = new EventEmitter<boolean>();
  @Output() handleBitSets = new EventEmitter<Fields>();
  @Output() handleBitSetsOfComposite = new EventEmitter<HandleBitSet>();

  formControl!: FormControl;
  form!: FormGroup;
  hideField: boolean = null;

  constructor(private rootFormGroup: FormGroupDirective, private formControlService: FormControlService) {
  }

  ngOnInit() {
    if (this.position !== null) {
      this.form = this.rootFormGroup.control.controls[this.position] as FormGroup;
    } else {
      this.form = this.rootFormGroup.control;
    }
    this.formControl = this.form.get(this.fieldData.field.name) as FormControl;

    if(this.fieldData.field.form.dependsOn) {
      // console.log(this.fieldData.field.form.dependsOn);
      this.enableDisableField(this.form.get(this.fieldData.field.form.dependsOn.name).value);

      this.form.get(this.fieldData.field.form.dependsOn.name).valueChanges.subscribe(value => {
        this.enableDisableField(value);
      });
    }

    // console.log(this.fieldData);
    // console.log(this.form);
    // console.log(this.formControl);
  }

  /** Handle Arrays --> **/

  fieldAsFormArray() {
    return this.formControl as unknown as FormArray;
  }

  push(field: string, required: boolean, type: string) {
    switch (type) {
      case 'url':
        this.fieldAsFormArray().push(required ? new FormControl('', Validators.compose([Validators.required, URLValidator]), urlAsyncValidator(this.formControlService))
          : new FormControl('', URLValidator, urlAsyncValidator(this.formControlService)));
        break;
      default:
        this.fieldAsFormArray().push(required ? new FormControl('', Validators.required) : new FormControl(''));
    }
  }

  remove(field: string, i: number) {
    this.fieldAsFormArray().removeAt(i);
  }

  /** check fields validity--> **/

  checkFormValidity(): boolean {
    return (!this.formControl.valid && this.formControl.touched);
  }

  checkFormArrayValidity(name: string, position: number, edit: boolean, groupName?: string): boolean {
    if (groupName) {
      return (!this.fieldAsFormArray()?.get([position])?.get(groupName).valid
        && (edit || this.fieldAsFormArray()?.get([position])?.get(groupName).dirty));
    }
    return (!this.fieldAsFormArray().get([position]).valid
      && (edit || this.fieldAsFormArray().get([position]).dirty));
  }

  /** Bitsets--> **/

  updateBitSet(fieldData: Fields) {
    this.timeOut(200).then(() => { // Needed for radio buttons strange behaviour
      if (fieldData.field.form.mandatory) {
        this.handleBitSets.emit(fieldData);
      }
    });
  }

  /** other stuff--> **/
  unsavedChangesPrompt() {
    console.log('string-field.component emitting to parent->');
    this.hasChanges.emit(true);
  }

  enableDisableField(value) {
    // console.log(value);
    if (value === true || value === 'Other, please specify') {
      this.formControl.enable();
      this.hideField = false;

    } else {
      this.formControl.disable();
      this.formControl.reset();
      this.hideField = true;
      // maybe add this if the remaining empty fields are a problem
      // (this.formControl as unknown as FormArray).clear();

    }
  }

  timeOut(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

}

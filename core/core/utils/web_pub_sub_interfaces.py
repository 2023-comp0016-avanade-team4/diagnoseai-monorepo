"""
Some partial interfaces for WebPubSub objects

There are no Azure function SDKs for these, so we have to make our own
"""

from dataclasses import dataclass, field

from dataclasses_json import (DataClassJsonMixin, Undefined, config,
                              dataclass_json)


# In theory this means that the methods are overridden twice. We keep
# the DataClassJsonMixin so that editors are happy with it.
@dataclass_json(undefined=Undefined.EXCLUDE)
@dataclass
class WebPubSubConnectionContext(DataClassJsonMixin):
    """
    A partial representation of the WebPubSubConnectionContext. All of
    the the irrelevant attributes are stripped away.
    """
    connection_id: str = field(metadata=config(field_name="connectionId"))


@dataclass_json(undefined=Undefined.EXCLUDE)
@dataclass
class WebPubSubRequest(DataClassJsonMixin):
    """
    A partial representation of the WebPubSubRequest. All of the
    irrelevant attributes are stripped away, so we are only left with
    those that are useful to us
    """
    data: str

    connection_context: WebPubSubConnectionContext = field(
        metadata=config(field_name="connectionContext"))
